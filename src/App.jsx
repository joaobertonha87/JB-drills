
import React,{useEffect,useMemo,useRef,useState}from"react";
import{Stage,Layer,Image as KImage,Circle,Text,Group,Arrow,Rect,Line,Path}from"react-konva";
import{
 Grid2X2,ClipboardList,Library,Users,Settings,Cloud,Save,Share2,UserRound,GraduationCap,
 CircleDot,Triangle,MoveRight,Square,Type,MousePointer2,Move,RotateCw,Trash2,Undo2,Redo2,
 Eye,EyeOff,Play,Square as StopSquare,Plus,Pencil,ChevronLeft,ChevronRight,Download,
 Copy,ImageDown,PanelTop,FolderOpen,ListOrdered
}from"lucide-react";

const W=1000,COURT_H=520,LEGEND_H=104,H=COURT_H+LEGEND_H, LIME="#54e600", BLUE="#31b7ff", YELLOW="#f4f72b";
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clone=o=>JSON.parse(JSON.stringify(o));
function useAsset(src){const[i,setI]=useState(null);useEffect(()=>{const x=new Image();x.src=src;x.onload=()=>setI(x)},[src]);return i}
const starter=()=>[
 {id:uid(),type:"player",team:"A",x:300,y:385,label:"1",name:"Jogador 1",sprite:"back",facing:"right",visible:true},
 {id:uid(),type:"player",team:"A",x:700,y:385,label:"2",name:"Jogador 2",sprite:"back",facing:"left",visible:true},
 {id:uid(),type:"player",team:"B",x:310,y:160,label:"3",name:"Jogador 3",sprite:"front",facing:"right",visible:true},
 {id:uid(),type:"player",team:"B",x:690,y:160,label:"4",name:"Jogador 4",sprite:"front",facing:"left",visible:true},
 {id:uid(),type:"coach",x:92,y:335,label:"P",name:"Professor",sprite:"coach",facing:"right",visible:true}
];

export default function App(){
 const stageRef=useRef(), boxRef=useRef();
 const court=useAsset("/assets/arena-exact-premium-v138.jpg"),
 topMale=useAsset("/assets/player_top_male_v142.png"),
 topFemale=useAsset("/assets/player_top_female_v142.png"),
 bottomMale=useAsset("/assets/player_bottom_male_v142.png"),
 bottomFemale=useAsset("/assets/player_bottom_female_v142.png"),
 coachImg=useAsset("/assets/coach_clean.png");
 const[items,setItems]=useState(()=>{try{return JSON.parse(localStorage.getItem("jb143-items"))||starter()}catch{return starter()}});
 const[selected,setSelected]=useState(null),[teamTab,setTeamTab]=useState("A"),[mode,setMode]=useState("select"),[draft,setDraft]=useState(null);
 const[history,setHistory]=useState([]),[future,setFuture]=useState([]),[scale,setScale]=useState(1);
 const[title,setTitle]=useState("Saque + subida"),[category,setCategory]=useState("Ofensiva"),[level,setLevel]=useState("Intermediário"),[desc,setDesc]=useState("Saque profundo no meio + subida para a rede.");
 const[scenes,setScenes]=useState(()=>{try{return JSON.parse(localStorage.getItem("jb143-scenes"))||[]}catch{return[]}});
 const[scene,setScene]=useState(0),[showPath,setShowPath]=useState(true),[showZones,setShowZones]=useState(true),[showNums,setShowNums]=useState(false),[showBrand,setShowBrand]=useState(true);
 const[playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[courtMode,setCourtMode]=useState("full");
 const[arrowColor,setArrowColor]=useState("#f4f72b");
 const[drawColor,setDrawColor]=useState("#ffffff");
 const[drawWidth,setDrawWidth]=useState(5);
 const[smartDraw,setSmartDraw]=useState(true);
 const[elementColor,setElementColor]=useState("#f4f72b");
 const[viewStyle,setViewStyle]=useState("3d");
 const[toolFeedback,setToolFeedback]=useState("Selecionar ativo");
 const[fundamento,setFundamento]=useState("Saque");
 const fundamentos=["Saque","Smash","Bandeja","Voleio FH","Voleio BH","Curta","Gancho","Anômalo","Rainbow","Defesa","Topspin","Slice","Drive","Flat","Swing Volley","Fast Hands"];

 useEffect(()=>{
  const r=()=>{
    if(!boxRef.current)return;
    const width=boxRef.current.clientWidth||W;
    setScale(Math.min(1,Math.max(.40,width/W)));
  };
  r();
  const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(r):null;
  if(ro&&boxRef.current)ro.observe(boxRef.current);
  window.addEventListener("resize",r,{passive:true});
  window.addEventListener("orientationchange",r,{passive:true});
  return()=>{ro?.disconnect();window.removeEventListener("resize",r);window.removeEventListener("orientationchange",r)};
 },[]);
 useEffect(()=>{
  try{
    const m=JSON.parse(localStorage.getItem("jb143-meta")||"null");
    if(m){
      if(m.title)setTitle(m.title);
      if(m.category)setCategory(m.category);
      if(m.level)setLevel(m.level);
      if(m.desc)setDesc(m.desc);
      if(m.fundamento)setFundamento(m.fundamento);
    }
  }catch{}
 },[]);
 useEffect(()=>{if(!playing)return;const t=setInterval(()=>setProgress(p=>p>=100?(setPlaying(false),0):p+1),100);return()=>clearInterval(t)},[playing]);
 const sel=useMemo(()=>items.find(x=>x.id===selected),[items,selected]);
 const activateMode=(next,label)=>{setMode(next);setDraft(null);setToolFeedback(label)};
 const flash=(label)=>setToolFeedback(label);
 const commit=n=>{setHistory(h=>[...h,clone(items)].slice(-40));setItems(n);setFuture([])};
 const patch=(id,p)=>setItems(v=>v.map(x=>x.id===id?{...x,...p}:x));
 const undo=()=>{if(!history.length){flash("Nada para desfazer");return}setFuture(f=>[clone(items),...f]);setItems(history.at(-1));setHistory(h=>h.slice(0,-1));flash("Desfeito")};
 const redo=()=>{if(!future.length){flash("Nada para refazer");return}setHistory(h=>[...h,clone(items)]);setItems(future[0]);setFuture(f=>f.slice(1));flash("Refeito")};
 const addPlayer=t=>{
   let n=items.filter(x=>x.type==="player").length+1;
   const slots=[
     {x:350,y:145,team:"B"},
     {x:650,y:145,team:"B"},
     {x:275,y:405,team:"A"},
     {x:725,y:405,team:"A"}
   ];
   const used=items.filter(x=>x.type==="player").length;
   const slot=slots[Math.min(used,3)]||{x:500,y:350,team:t};
   const obj={id:uid(),type:"player",team:slot.team,x:slot.x,y:slot.y,label:String(n),name:`Jogador ${n}`,visible:true};
   commit([...items,obj]);setSelected(obj.id);activateMode("select","Jogador adicionado e selecionado");
 };
 const addCoach=()=>{
   const obj={id:uid(),type:"coach",x:92,y:335,label:"P",name:"Professor",sprite:"coach",facing:"right",visible:true};
   commit([...items,obj]);setSelected(obj.id);activateMode("select","Professor adicionado e selecionado");
 };
 const addSimple=t=>{
   const color=t==="ball"?"#f4f72b":t==="cone"?"#ff9f1a":elementColor;
   const obj={id:uid(),type:t,x:450,y:350,name:t==="ball"?"Bola":t==="cone"?"Cone":"Texto",text:t==="text"?"Observação":"",color,visible:true};
   commit([...items,obj]);setSelected(obj.id);activateMode("select",`${obj.name} adicionado e selecionado`);
 };
 const addStep=()=>{
   const nums=items.filter(x=>x.type==="step").map(x=>Number(x.number)||0);
   const next=(nums.length?Math.max(...nums):0)+1;
   const col=next%2===0?BLUE:LIME;
   const obj={id:uid(),type:"step",x:500,y:260,number:next,name:`Passo ${next}`,color:col,size:30,visible:true};
   commit([...items,obj]);setSelected(obj.id);activateMode("select",`Passo ${next} adicionado ✓`);
 };
 const del=()=>{if(sel){commit(items.filter(x=>x.id!==sel.id));setSelected(null);flash("Elemento excluído")}else flash("Selecione um elemento para excluir")};
 const duplicate=()=>{if(!sel)return;const c={...clone(sel),id:uid(),x:(sel.x||0)+22,y:(sel.y||0)+22};commit([...items,c])};
 const save=()=>{localStorage.setItem("jb143-items",JSON.stringify(items));localStorage.setItem("jb143-scenes",JSON.stringify(scenes));localStorage.setItem("jb143-meta",JSON.stringify({title,category,level,desc,fundamento}))};
 const exportPNG=()=>{
  const uri=stageRef.current?.toDataURL({pixelRatio:2});
  if(!uri)return;
  const name=title.replace(/\W+/g,"_")+".png";
  const isiPad=/iPad|Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1;
  if(isiPad){
    const win=window.open();
    if(win){win.document.write(`<title>${name}</title><img src="${uri}" style="max-width:100%;height:auto">`);win.document.close();return;}
  }
  const a=document.createElement("a");a.href=uri;a.download=name;document.body.appendChild(a);a.click();a.remove();
 };
 const recognizeStroke=(pts,color,width)=>{
  if(!pts||pts.length<6)return null;
  const raw=[];for(let i=0;i<pts.length;i+=2)raw.push({x:pts[i],y:pts[i+1]});
  const p=[raw[0]];
  for(let i=1;i<raw.length;i++){const a=p[p.length-1],b=raw[i];if(Math.hypot(b.x-a.x,b.y-a.y)>=2)p.push(b)}
  if(p.length<3)return null;
  let path=0;for(let i=1;i<p.length;i++)path+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
  const a=p[0],b=p[p.length-1],direct=Math.hypot(b.x-a.x,b.y-a.y);
  const xs=p.map(q=>q.x),ys=p.map(q=>q.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const bw=maxX-minX,bh=maxY-minY,diag=Math.hypot(bw,bh);
  if(direct>22){
   const dx=b.x-a.x,dy=b.y-a.y,den=Math.hypot(dx,dy)||1;
   let avg=0,max=0;for(const q of p){const d=Math.abs(dy*q.x-dx*q.y+b.x*a.y-b.y*a.x)/den;avg+=d;max=Math.max(max,d)}avg/=p.length;
   if((direct/path>.72&&avg<Math.max(15,direct*.11))||max<Math.max(20,direct*.14))
    return {id:uid(),type:"arrow",points:[a.x,a.y,b.x,b.y],color,width:Math.max(4,width),smart:true,visible:true};
  }
  // SETA CURVA: reconhece um gesto aberto com curvatura consistente.
  if(p.length>=6 && direct>24 && path/direct>1.08 && path/direct<3.8){
   const ax=b.x-a.x,ay=b.y-a.y,den=Math.hypot(ax,ay)||1;
   let best=p[Math.floor(p.length/2)],bestDev=0,sign=0,same=0,total=0;
   for(let k=1;k<p.length-1;k++){
    const q=p[k];
    const cross=ax*(q.y-a.y)-ay*(q.x-a.x);
    const dev=Math.abs(cross)/den;
    if(dev>bestDev){bestDev=dev;best=q}
    if(Math.abs(cross)>den*3){const sg=Math.sign(cross);if(!sign)sign=sg;if(sg===sign)same++;total++}
   }
   const consistency=total?same/total:0;
   if(bestDev>Math.max(12,direct*.08) && consistency>.68){
    return {id:uid(),type:"curvedArrow",points:[a.x,a.y,best.x,best.y,b.x,b.y],color,width:Math.max(4,width),smart:true,visible:true};
   }
  }
  if(p.length>=8&&diag>28&&direct<Math.max(60,diag*.5)&&bw>15&&bh>15&&bw/bh>.45&&bw/bh<2.2){
   const cx=(minX+maxX)/2,cy=(minY+maxY)/2,rs=p.map(q=>Math.hypot(q.x-cx,q.y-cy));
   const mean=rs.reduce((x,y)=>x+y,0)/rs.length,sd=Math.sqrt(rs.reduce((x,y)=>x+(y-mean)**2,0)/rs.length);
   if(sd/(mean||1)<.52)return {id:uid(),type:"smartCircle",x:cx,y:cy,radius:Math.max(12,(bw+bh)/4),color,width:Math.max(3,width),visible:true};
  }
  return null;
 };
 const point=()=>{const p=stageRef.current?.getPointerPosition();return p?{x:p.x/scale,y:p.y/scale}:null};
 const down=(e)=>{
   if(!["arrow","zone","freeDraw"].includes(mode))return;
   e?.evt?.preventDefault?.();
   const p=point();if(!p)return;
   if(mode==="arrow")setDraft({type:"arrow",points:[p.x,p.y,p.x,p.y],color:arrowColor});
   else if(mode==="zone")setDraft({type:"zone",x:p.x,y:p.y,w:0,h:0});
   else setDraft({type:"freeDraw",points:[p.x,p.y],color:drawColor,width:drawWidth});
 };
 const move=(e)=>{
   if(!draft)return;
   e?.evt?.preventDefault?.();
   const p=point();if(!p)return;
   if(draft.type==="arrow")setDraft(d=>({...d,points:[d.points[0],d.points[1],p.x,p.y]}));
   else if(draft.type==="zone")setDraft(d=>({...d,w:p.x-d.x,h:p.y-d.y}));
   else if(draft.type==="freeDraw")setDraft(d=>({...d,points:[...d.points,p.x,p.y]}));
 };
 const up=(e)=>{
   if(!draft)return;
   e?.evt?.preventDefault?.();
   if(draft.type==="arrow"){
     const obj={id:uid(),type:"arrow",points:draft.points,color:draft.color||arrowColor,visible:true};
     commit([...items,obj]);setSelected(obj.id);activateMode("select","Seta criada e selecionada");
   }else if(draft.type==="zone"){
     const obj={id:uid(),type:"zone",x:draft.x,y:draft.y,w:draft.w,h:draft.h,color:LIME,visible:true};
     commit([...items,obj]);setSelected(obj.id);activateMode("select","Zona criada e selecionada");
   }else if(draft.type==="freeDraw"){
     if(draft.points.length>=4){
       const obj=smartDraw?recognizeStroke(draft.points,draft.color||drawColor,draft.width||drawWidth):null;
       if(obj){commit([...items,obj]);setSelected(obj.id);flash(obj.type==="smartCircle"?"Círculo reconhecido ✓":obj.type==="curvedArrow"?"Seta curva reconhecida ✓":"Seta reconhecida ✓")}
       else{const free={id:uid(),type:"freeDraw",points:draft.points,color:draft.color||drawColor,width:draft.width||drawWidth,visible:true};commit([...items,free]);setSelected(free.id);flash("Desenho livre criado")}
     }
     setDraft(null);
   }
 };
 const newScene=()=>{const next=[...scenes,{id:uid(),title:`Cena ${scenes.length+1}`,items:clone(items)}];setScenes(next);setScene(next.length-1)};
 const updateScene=()=>{let n=[...scenes],s={id:n[scene]?.id||uid(),title:`Cena ${scene+1}`,items:clone(items)};if(!n.length)n=[s];else n[scene]=s;setScenes(n)};
 const openScene=i=>{if(scenes[i]){setScene(i);setItems(clone(scenes[i].items))}};
 const sprite=i=>{
  if(i.type==="coach") return coachImg;
  const isTop=i.y < COURT_H/2;
  const isRight=i.x >= W/2;
  if(isTop) return isRight ? topFemale : topMale;
  return isRight ? bottomFemale : bottomMale;
};

 const render=i=>{
  if(i.visible===false)return null;const active=i.id===selected;
  if(i.type==="player"||i.type==="coach"){
   const im=sprite(i),col=i.type==="coach"?"#fff":i.team==="A"?LIME:"#14aee8";

   if(i.type==="coach"){
     const cw=112,ch=154;
     return <Group key={i.id} x={i.x} y={i.y} draggable={true} onMouseDown={()=>setSelected(i.id)} onTouchStart={()=>setSelected(i.id)} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
       {im&&<KImage image={im} x={-cw/2} y={-ch+48} width={cw} height={ch}/>}
     </Group>
   }

   const isTop=i.y < COURT_H/2;
   const sw=isTop?78:104, sh=isTop?112:154;
   return <Group key={i.id} x={i.x} y={i.y} draggable={true} onMouseDown={()=>setSelected(i.id)} onTouchStart={()=>setSelected(i.id)} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
     <Group scaleX={1}>
       {im&&<KImage image={im} x={-sw/2} y={-sh+48} width={sw} height={sh}/>}
       {/* Racket is drawn separately so it can never disappear with sprite masking. */}
     </Group>
   </Group>
  }
  if(i.type==="ball")return <Circle key={i.id} x={i.x} y={i.y} radius={11} fill={i.color||"#f4f72b"} stroke={active?"#ffffff":"#182024"} shadowColor="#000" shadowBlur={6} shadowOpacity={.35} strokeWidth={3} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="cone")return <Group key={i.id} x={i.x} y={i.y} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}><Circle radius={17} fill="#101719" stroke={active?"#fff":"#293438"} strokeWidth={3}/><Text x={-12} y={-13} width={24} align="center" text="▲" fill={i.color||"#ff9f1a"} fontStyle="bold" fontSize={24}/></Group>;
  if(i.type==="text")return <Text key={i.id} x={i.x} y={i.y} text={i.text||"Texto"} fill="#fff" fontSize={18} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="step"){
   const r=i.size||30,stroke=active?"#ffffff":"#061014",fill=i.color||LIME;
   return <Group key={i.id} x={i.x} y={i.y} draggable={true} onMouseDown={()=>setSelected(i.id)} onTouchStart={()=>setSelected(i.id)} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
     <Circle radius={r} fill="#061014" opacity={.30}/>
     <Circle radius={r-3} fill={fill} stroke={stroke} strokeWidth={active?4:3} shadowColor="#000" shadowBlur={10} shadowOpacity={.35}/>
     <Circle radius={r-8} fill="#071318" opacity={.92}/>
     <Text x={-r} y={-12} width={r*2} align="center" text={String(i.number||1)} fill="#ffffff" fontStyle="bold" fontSize={22}/>
   </Group>;
  }
  if(i.type==="arrow"&&showPath)return <Arrow key={i.id} points={i.points} stroke={active?"#fff":i.color||YELLOW} fill={active?"#fff":i.color||YELLOW} strokeWidth={i.width||6} dash={i.smart?[]:[13,8]} pointerLength={17} pointerWidth={17} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)}/>;
  if(i.type==="zone"&&showZones)return <Rect key={i.id} x={i.x} y={i.y} width={i.w} height={i.h} fill="rgba(84,230,0,.12)" stroke={active?"#fff":i.color||LIME} strokeWidth={3} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)}/>;
  if(i.type==="curvedArrow"){
   if(!Array.isArray(i.points)||i.points.length<6)return null;
   const [x1,y1,cx,cy,x2,y2]=i.points;
   const stroke=active?"#fff":(i.color||drawColor||"#fff");
   const d=`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
   const ang=Math.atan2(y2-cy,x2-cx), ah=16+(i.width||5);
   const a1x=x2-ah*Math.cos(ang-.55),a1y=y2-ah*Math.sin(ang-.55);
   const a2x=x2-ah*Math.cos(ang+.55),a2y=y2-ah*Math.sin(ang+.55);
   return <Group key={i.id} draggable={mode==="select"||mode==="move"} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)}
     onDragEnd={e=>{
       const dx=e.target.x(),dy=e.target.y();
       patch(i.id,{points:i.points.map((v,idx)=>v+(idx%2===0?dx:dy))});
       e.target.position({x:0,y:0});
     }}>
     <Path data={d} stroke={stroke} strokeWidth={i.width||5} fill="transparent" lineCap="round" lineJoin="round" hitStrokeWidth={22}/>
     <Line points={[a1x,a1y,x2,y2,a2x,a2y]} stroke={stroke} strokeWidth={i.width||5} lineCap="round" lineJoin="round" hitStrokeWidth={22}/>
   </Group>;
  }
  if(i.type==="smartCircle")return <Circle key={i.id} x={i.x} y={i.y} radius={i.radius} fill="rgba(0,0,0,0)" stroke={active?"#fff":i.color} strokeWidth={i.width||5} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="freeDraw")return <Line key={i.id} points={i.points} stroke={active?"#ffffff":i.color||"#ffffff"} strokeWidth={i.width||5} lineCap="round" lineJoin="round" draggable={mode==="select"||mode==="move"} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>{const dx=e.target.x(),dy=e.target.y();patch(i.id,{points:i.points.map((v,idx)=>v+(idx%2===0?dx:dy))});e.target.position({x:0,y:0})}}/>;
 };

 const playerList=items.filter(x=>teamTab==="P"?x.type==="coach":x.type==="player"&&x.team===teamTab);

 return <div className="app">
  <header className="top">
   <div className="logo"><b>JB</b><div><strong>JB TACTICS</strong><small>TACTICAL BOARD • BEACH TENNIS</small></div></div>
   <nav className="navtabs"><button className="navactive"><Grid2X2/>Táticas</button><button disabled title="Em desenvolvimento"><ClipboardList/>Exercícios</button><button disabled title="Em desenvolvimento"><Library/>Biblioteca</button><button disabled title="Em desenvolvimento"><Users/>Alunos</button><button disabled title="Em desenvolvimento"><Settings/>Configurações</button></nav>
   <div className="actions"><button className="cloud" disabled title="Sincronização em desenvolvimento"><Cloud/></button><button className="save" onClick={save}><Save/>Salvar</button><button className="export" onClick={exportPNG}><Share2/>Exportar</button></div>
  </header>

  <div className="studio">
   <aside className="left panel">
    <h3>MODO DE QUADRA</h3>
    <div className="seg">
      <button type="button" className={courtMode==="full"?"on":""} onClick={()=>{setCourtMode("full");flash("Quadra inteira selecionada")}}>Quadra inteira</button>
      <button type="button" className={courtMode==="half"?"on":""} onClick={()=>{setCourtMode("half");flash("Meia quadra selecionada")}}>Meia quadra</button>
    </div>

    <div className="toolFeedback"><span></span>{toolFeedback}</div>

    <h3>ELEMENTOS</h3>
    <Tool icon={<UserRound/>} text="Jogador 3D" onClick={()=>addPlayer(teamTab==="B"?"B":"A")}/>
    <Tool icon={<GraduationCap/>} text="Professor" onClick={addCoach}/>
    <Tool icon={<CircleDot/>} text="Bola" onClick={()=>addSimple("ball")}/>
    {(sel?.type==="ball")&&<div className="elementColorPicker">
      {["#f4f72b","#54e600","#31b7ff","#ff4d4f","#ffffff","#ff9f1a"].map(c=><button type="button" key={c} className={(sel.color||"#f4f72b")===c?"picked":""} style={{background:c}} onClick={()=>{patch(sel.id,{color:c});setElementColor(c);flash("Cor da bola alterada")}}></button>)}
    </div>}
    <Tool icon={<Triangle/>} text="Cone" onClick={()=>addSimple("cone")}/>
    {(sel?.type==="cone")&&<div className="elementColorPicker">
      {["#ff9f1a","#f4f72b","#54e600","#31b7ff","#ff4d4f","#ffffff"].map(c=><button type="button" key={c} className={(sel.color||"#ff9f1a")===c?"picked":""} style={{background:c}} onClick={()=>{patch(sel.id,{color:c});setElementColor(c);flash("Cor do cone alterada")}}></button>)}
    </div>}
    <Tool icon={<ListOrdered/>} text="Passo / Número" onClick={addStep}/>

    <Tool active={mode==="freeDraw"} icon={<Pencil/>} text="Desenho livre" onClick={()=>activateMode(mode==="freeDraw"?"select":"freeDraw",mode==="freeDraw"?"Selecionar ativo":"Lápis ativo • desenhe na quadra")}/>
    {mode==="freeDraw"&&<div className="freeDrawControls">
      <span className="controlTitle">COR DO LÁPIS</span>
      <div className="freeDrawColors">
        {["#ffffff","#f4f72b","#54e600","#31b7ff","#ff4d4f","#ff9f1a","#a855f7","#111111"].map(c=><button type="button" key={c} aria-label={`Cor ${c}`} className={drawColor===c?"picked":""} style={{background:c}} onClick={()=>{setDrawColor(c);flash("Cor do lápis alterada")}}></button>)}
      </div>
      <label className="drawWidthLabel">Espessura
        <input type="range" min="2" max="14" step="1" value={drawWidth} onChange={e=>setDrawWidth(Number(e.target.value))}/>
      </label>
      <button type="button" className={"smartDrawToggle "+(smartDraw?"on":"")} onClick={()=>{setSmartDraw(v=>!v);flash(!smartDraw?"Smart Draw ativado":"Smart Draw desativado")}}>
        {smartDraw?"Smart Draw: ATIVO":"Smart Draw: DESATIVADO"}
      </button>
      {smartDraw&&<div className="smartHint">Solte o dedo/Pencil para reconhecer:<br/><b>reta → seta perfeita</b><br/><b>curva → seta curva perfeita</b><br/><b>círculo → círculo perfeito</b></div>}
    </div>}

    <Tool active={mode==="arrow"} icon={<MoveRight/>} text="Seta" onClick={()=>activateMode("arrow","Seta ativa • arraste na quadra")}/>
    {(mode==="arrow"||sel?.type==="arrow")&&<div className="quickArrowColors">
      {["#f4f72b","#54e600","#31b7ff","#ff4d4f","#ffffff"].map(c=><button type="button" key={c} className={arrowColor===c?"picked":""} style={{background:c}} onClick={()=>{setArrowColor(c);if(sel?.type==="arrow")patch(sel.id,{color:c});flash("Cor da seta alterada")}} aria-label={`Cor da seta ${c}`}></button>)}
    </div>}

    <Tool active={mode==="zone"} icon={<Square/>} text="Área / Zona" onClick={()=>activateMode("zone","Zona ativa • arraste na quadra")}/>
    <Tool icon={<Type/>} text="Texto" onClick={()=>addSimple("text")}/>

    <h3>FERRAMENTAS</h3>
    <Tool active={mode==="select"} icon={<MousePointer2/>} text="Selecionar" onClick={()=>activateMode("select","Selecionar ativo")}/>
    <Tool active={mode==="move"} icon={<Move/>} text="Mover" onClick={()=>activateMode("move","Mover ativo • arraste os elementos")}/>
    <Tool icon={<RotateCw/>} text="Orientar corpo" onClick={()=>{if(sel&&(sel.type==="player"||sel.type==="coach")){const order=["down","right","up","left"];const n=(order.indexOf(sel.facing||"down")+1)%order.length;patch(sel.id,{facing:order[n]});flash("Orientação alterada")}else flash("Selecione um jogador ou professor")}}/>
    <Tool icon={<Trash2/>} text="Excluir" onClick={del}/>
    <Tool icon={<Undo2/>} text="Desfazer" onClick={undo}/>
    <Tool icon={<Redo2/>} text="Refazer" onClick={redo}/>
   </aside>

   <main className={"center "+(viewStyle==="3d"?"view3d":"view2d")}>
    <div className="viewModeToggle">
      <button className={viewStyle==="3d"?"on":""} onClick={()=>{setViewStyle("3d");flash("Visual 3D Premium ativo")}}>3D</button>
      <button className={viewStyle==="2d"?"on":""} onClick={()=>{setViewStyle("2d");flash("Visual 2D ativo")}}>2D</button>
    </div>
<div className="courtBox" ref={boxRef} style={{height:H*scale}}>
     <div style={{width:W*scale,height:H*scale}}>
      <Stage ref={stageRef} width={W*scale} height={H*scale} scaleX={scale} scaleY={scale} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{setDraft(null);setMode("select")}}>
       <Layer>
        {/* V1.38: arena premium em perspectiva aprovada.
            Rede, linhas, iluminação e decoração pertencem ao cenário-base.
            Somente os elementos táticos interativos são desenhados acima. */}
        {court&&<KImage image={court} x={0} y={0} width={W} height={COURT_H}/>}

        {/* V1.43 — rede de Beach Tennis mais alta */}
        <Group listening={false}>
          {/* corpo da rede, cobrindo visualmente a rede baixa do cenário */}
          <Rect x={118} y={214} width={764} height={92}
            fill="#090c0d" opacity={0.72}
            shadowColor="#000" shadowBlur={12} shadowOpacity={0.35}/>
          {/* malha horizontal */}
          {Array.from({length:10}).map((_,idx)=>(
            <Line key={`bth-${idx}`}
              points={[122,220+idx*8.2,878,220+idx*8.2]}
              stroke="#c9c3ad" strokeWidth={0.8} opacity={0.50}/>
          ))}
          {/* malha vertical */}
          {Array.from({length:50}).map((_,idx)=>(
            <Line key={`btv-${idx}`}
              points={[126+idx*15.2,218,126+idx*15.2,303]}
              stroke="#bdb7a3" strokeWidth={0.7} opacity={0.42}/>
          ))}
          {/* fita superior e inferior */}
          <Rect x={116} y={209} width={768} height={10} cornerRadius={3} fill="#111516"/>
          <Rect x={116} y={302} width={768} height={6} cornerRadius={2} fill="#111516"/>

          {/* postes mais altos */}
          <Rect x={102} y={198} width={30} height={128} cornerRadius={6}
            fill="#0a0f11" stroke="#263238" strokeWidth={2}
            shadowColor="#000" shadowBlur={10} shadowOpacity={0.4}/>
          <Rect x={868} y={198} width={30} height={128} cornerRadius={6}
            fill="#0a0f11" stroke="#263238" strokeWidth={2}
            shadowColor="#000" shadowBlur={10} shadowOpacity={0.4}/>
          <Text x={106} y={248} width={22} align="center" text="JB"
            fill="#76ff00" fontSize={13} fontStyle="bold"/>
          <Text x={872} y={248} width={22} align="center" text="JB"
            fill="#76ff00" fontSize={13} fontStyle="bold"/>
        </Group>

        {items.map(render)}
        {draft?.type==="arrow"&&<Arrow points={draft.points} stroke={draft.color||arrowColor} fill={draft.color||arrowColor} strokeWidth={6} dash={[13,8]} pointerLength={17} pointerWidth={17}/>}
        {draft?.type==="zone"&&<Rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="rgba(84,230,0,.12)" stroke={LIME} strokeWidth={3}/>}
        {draft?.type==="freeDraw"&&<Line points={draft.points} stroke={draft.color||drawColor} strokeWidth={draft.width||drawWidth} lineCap="round" lineJoin="round"/>}

        {/* Card de legenda faz parte do canvas e aparece na exportação */}
        <Rect x={0} y={COURT_H} width={W} height={LEGEND_H} fill="#071116"/>
        <Rect x={18} y={COURT_H+14} width={964} height={76} cornerRadius={12} fill="#0b1b22" stroke="#203840" strokeWidth={2}/>
        <Text x={38} y={COURT_H+27} text="LEGENDA DAS CORES" fill="#ffffff" fontSize={12} fontStyle="bold" letterSpacing={2}/>
        <Circle x={56} y={COURT_H+60} radius={9} fill="#f4f72b"/>
        <Text x={76} y={COURT_H+52} text="TRAJETÓRIA DA BOLA" fill="#dbe5e8" fontSize={12} fontStyle="bold"/>
        <Circle x={374} y={COURT_H+60} radius={9} fill="#54e600"/>
        <Text x={394} y={COURT_H+52} text="MOVIMENTAÇÃO DO ALUNO" fill="#dbe5e8" fontSize={12} fontStyle="bold"/>
        <Circle x={721} y={COURT_H+60} radius={9} fill="#31b7ff"/>
        <Text x={741} y={COURT_H+52} text="BOLA LANÇADA PELO PROFESSOR" fill="#dbe5e8" fontSize={12} fontStyle="bold"/>
       </Layer>
      </Stage>
     </div>
    </div>
    <div className="fundamentoBar">
      <div className="fundamentoLabel">
        <span>FUNDAMENTO</span>
        <strong>{fundamento}</strong>
      </div>
      <select value={fundamento} onChange={e=>setFundamento(e.target.value)} aria-label="Selecionar fundamento">
        {fundamentos.map(f=><option key={f} value={f}>{f}</option>)}
      </select>
    </div>
   </main>

   <aside className="right panel">
    <h3>JOGADORES</h3><div className="seg three"><button className={teamTab==="A"?"on":""} onClick={()=>setTeamTab("A")}>Dupla A</button><button className={teamTab==="B"?"on":""} onClick={()=>setTeamTab("B")}>Dupla B</button><button className={teamTab==="P"?"on":""} onClick={()=>setTeamTab("P")}>Professor</button></div>
    <div className="players">{playerList.map((p,n)=><div className="playerRow" key={p.id}><i>{p.label}</i><span>{p.name}</span><button onClick={()=>setSelected(p.id)}><Pencil/></button><button onClick={()=>patch(p.id,{visible:p.visible===false})}>{p.visible===false?<EyeOff/>:<Eye/>}</button></div>)}</div>
    <h3>PROPRIEDADES</h3>
    {!sel?<div className="empty">Selecione um elemento da quadra.</div>:<div className="props"><label>Nome<input value={sel.name||sel.text||""} onChange={e=>sel.type==="text"?patch(sel.id,{text:e.target.value}):patch(sel.id,{name:e.target.value})}/></label>{sel.type==="arrow"?<>
 <label>Cor da seta
   <input type="color" value={sel.color||arrowColor} onChange={e=>{setArrowColor(e.target.value);patch(sel.id,{color:e.target.value})}}/>
 </label>
 <div className="arrowPalette">
   {["#f4f72b","#54e600","#31b7ff","#ff4d4f","#ffffff","#ff9f1a","#a855f7"].map(c=><button key={c} title={c} className={(sel.color||arrowColor)===c?"picked":""} style={{background:c}} onClick={()=>{setArrowColor(c);patch(sel.id,{color:c})}}></button>)}
 </div>
 </>:sel.type==="step"?<>
   <label>Número do passo
     <input type="number" min="1" max="99" value={sel.number||1} onChange={e=>patch(sel.id,{number:Math.max(1,Number(e.target.value)||1),name:`Passo ${Math.max(1,Number(e.target.value)||1)}`})}/>
   </label>
   <label>Cor do marcador
     <input type="color" value={sel.color||LIME} onChange={e=>patch(sel.id,{color:e.target.value})}/>
   </label>
   <label>Tamanho
     <input type="range" min="22" max="48" step="1" value={sel.size||30} onChange={e=>patch(sel.id,{size:Number(e.target.value)})}/>
   </label>
 </>:(sel.type==="ball"||sel.type==="cone")?<>
   <label>Cor
     <input type="color" value={sel.color||(sel.type==="ball"?"#f4f72b":"#ff9f1a")} onChange={e=>patch(sel.id,{color:e.target.value})}/>
   </label>
   <div className="arrowPalette">
    {["#f4f72b","#54e600","#31b7ff","#ff4d4f","#ffffff","#ff9f1a","#a855f7"].map(c=><button key={c} className={(sel.color||"")===c?"picked":""} style={{background:c}} onClick={()=>patch(sel.id,{color:c})}></button>)}
   </div>
 </>:sel.type==="freeDraw"?<>
   <label>Cor do desenho
     <input type="color" value={sel.color||drawColor} onChange={e=>{setDrawColor(e.target.value);patch(sel.id,{color:e.target.value});flash("Cor do desenho alterada")}}/>
   </label>
   <label>Espessura
     <input type="range" min="2" max="14" step="1" value={sel.width||5} onChange={e=>patch(sel.id,{width:Number(e.target.value)})}/>
   </label>
 </>:(sel.type==="player"||sel.type==="coach")?<>
   <label>Direção do corpo
     <div className="orientationButtons">
       <button type="button" className={(sel.facing||"down")==="down"?"chosen":""} onClick={()=>patch(sel.id,{facing:"down"})}>↓ Baixo</button>
       <button type="button" className={sel.facing==="up"?"chosen":""} onClick={()=>patch(sel.id,{facing:"up"})}>↑ Cima</button>
       <button type="button" className={sel.facing==="left"?"chosen":""} onClick={()=>patch(sel.id,{facing:"left"})}>← Esquerda</button>
       <button type="button" className={sel.facing==="right"?"chosen":""} onClick={()=>patch(sel.id,{facing:"right"})}>Direita →</button>
     </div>
   </label>
 </>:<label>Cor da base <input type="color" value={sel.color||YELLOW} onChange={e=>patch(sel.id,{color:e.target.value})}/></label>}
 <label>Escala<input type="range" min="70" max="130" defaultValue="100"/></label><button className="dup" onClick={duplicate}><Copy/>Duplicar</button></div>}
   </aside>

   <section className="info panel"><h3>INFORMAÇÕES DA TÁTICA</h3><label>Nome<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}><option>Ofensiva</option><option>Defensiva</option><option>Construção</option><option>Transição</option></select></label><label>Nível<select value={level} onChange={e=>setLevel(e.target.value)}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label><label>Descrição<textarea value={desc} onChange={e=>setDesc(e.target.value)}/></label></section>

   <section className="timeline panel">
    <div className="playbar"><button className="play" onClick={()=>setPlaying(!playing)}>{playing?<StopSquare/>:<Play/>}</button><span>1.0x</span><div className="track"><i style={{width:`${progress}%`}}></i><b style={{left:`${progress}%`}}></b></div><small>00:00 / 00:10</small></div>
    <div className="scenes">{(scenes.length?scenes:[{id:"current",items}]).map((s,i)=><button className={"thumb "+(i===scene?"chosen":"")} key={s.id} onClick={()=>s.id!=="current"&&openScene(i)}><em>{i+1}</em><div></div><span>{i+1}</span></button>)}<button className="addScene" onClick={newScene}><Plus/><span>Adicionar cena</span></button></div>
    <button className="updateScene" onClick={updateScene}>Atualizar cena atual</button>
   </section>

   <section className="view panel"><h3>VISUALIZAÇÃO</h3><Toggle text="Trajetória da bola" value={showPath} set={setShowPath}/><Toggle text="Zonas da quadra" value={showZones} set={setShowZones}/><Toggle text="Logo e identidade" value={showBrand} set={setShowBrand}/></section>
  </div>
 </div>
}
function Tool({icon,text,onClick,active}){return <button type="button" className={"tool "+(active?"active":"")} onClick={onClick}>{icon}<span>{text}</span></button>}
function Toggle({text,value,set}){return <div className="toggleRow"><span>{text}</span><button type="button" className={value?"yes":""} onClick={()=>set(!value)}><i></i></button></div>}
