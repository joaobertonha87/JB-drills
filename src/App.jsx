
import React,{useEffect,useMemo,useRef,useState}from"react";
import{Stage,Layer,Image as KImage,Circle,Text,Group,Arrow,Rect,Line,Path}from"react-konva";
import{
 Grid2X2,ClipboardList,Library,Users,Settings,Cloud,Save,Share2,UserRound,GraduationCap,
 CircleDot,Triangle,MoveRight,Square,Type,MousePointer2,Move,Trash2,Undo2,Redo2,
 Eye,EyeOff,Plus,Pencil,ChevronLeft,ChevronRight,Download,
 Copy,ImageDown,PanelTop,FolderOpen,ListOrdered
}from"lucide-react";

const W=1000,COURT_H=580,LEGEND_H=146,H=COURT_H+LEGEND_H, LIME="#54e600", BLUE="#31b7ff", YELLOW="#f4f72b";
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clone=o=>JSON.parse(JSON.stringify(o));
function useAsset(src){const[i,setI]=useState(null);useEffect(()=>{const x=new Image();x.src=src;x.onload=()=>setI(x)},[src]);return i}
const starter=()=>[
 {id:"p-left-top",type:"player",team:"A",side:"left",sprite:"leftTop",x:350,y:275,label:"1",name:"Jogador 1",visible:true,scale:100},
 {id:"p-left-bottom",type:"player",team:"A",side:"left",sprite:"leftBottom",x:330,y:455,label:"2",name:"Jogador 2",visible:true,scale:100},
 {id:"p-right-top",type:"player",team:"B",side:"right",sprite:"rightTop",x:705,y:275,label:"3",name:"Jogador 3",visible:true,scale:100},
 {id:"p-right-bottom",type:"player",team:"B",side:"right",sprite:"rightBottom",x:785,y:465,label:"4",name:"Jogador 4",visible:true,scale:100},
 {id:"coach-official",type:"coach",side:"left",x:75,y:360,label:"P",name:"Professor",visible:true,scale:100}
];

export default function App(){
 const stageRef=useRef(), boxRef=useRef();
 const court=useAsset("/assets/arena-3d-clean-v1551.jpg?v=1551"),
 leftTop=useAsset("/assets/player_left_top_v1544.png?v=1544"),
 leftBottom=useAsset("/assets/player_left_bottom_v1544.png?v=1544"),
 rightTop=useAsset("/assets/player_right_top_v1544.png?v=1544"),
 rightBottom=useAsset("/assets/player_right_bottom_v1544.png?v=1544"),
 coachImg=useAsset("/assets/coach_cart_v1544.png?v=1544");
 const[items,setItems]=useState(()=>{try{return JSON.parse(localStorage.getItem("jb1551-items"))||starter()}catch{return starter()}});
 const[selected,setSelected]=useState(null),[teamTab,setTeamTab]=useState("A"),[mode,setMode]=useState("select"),[draft,setDraft]=useState(null);
 const[history,setHistory]=useState([]),[future,setFuture]=useState([]),[scale,setScale]=useState(1);
 const[title,setTitle]=useState("Saque + subida"),[category,setCategory]=useState("Ofensiva"),[level,setLevel]=useState("Intermediário"),[desc,setDesc]=useState("Saque profundo no meio + subida para a rede.");
 const[scenes,setScenes]=useState(()=>{try{return JSON.parse(localStorage.getItem("jb1551-scenes"))||[]}catch{return[]}});
 const[scene,setScene]=useState(0),[showPath,setShowPath]=useState(true),[showZones,setShowZones]=useState(true),[showNums,setShowNums]=useState(false),[showBrand,setShowBrand]=useState(true);
 const[courtMode,setCourtMode]=useState("full");
 const[arrowColor,setArrowColor]=useState("#f4f72b");
 const[drawColor,setDrawColor]=useState("#ffffff");
 const[drawWidth,setDrawWidth]=useState(5);
 const[smartDraw,setSmartDraw]=useState(true);
 const[elementColor,setElementColor]=useState("#f4f72b");
 const[viewStyle,setViewStyle]=useState("3d");
 const[toolFeedback,setToolFeedback]=useState("Selecionar ativo");
 const[fundamento,setFundamento]=useState("Saque");
 const[playText,setPlayText]=useState("");
 const[steps,setSteps]=useState([]);
 const[stepIndex,setStepIndex]=useState(0);
 useEffect(()=>{
  try{
   Object.keys(localStorage)
    .filter(k=>k.startsWith("jb") && !k.startsWith("jb1551-"))
    .forEach(k=>localStorage.removeItem(k));
   if("caches" in window)caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))));
   if("serviceWorker" in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
  }catch{}
 },[]);
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
    const m=JSON.parse(localStorage.getItem("jb1551-meta")||"null");
    if(m){
      if(m.title)setTitle(m.title);
      if(m.category)setCategory(m.category);
      if(m.level)setLevel(m.level);
      if(m.desc)setDesc(m.desc);
      if(m.fundamento)setFundamento(m.fundamento);
    }
  }catch{}
 },[]);
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
     {x:350,y:275,team:"A",side:"left",sprite:"leftTop"},
     {x:330,y:455,team:"A",side:"left",sprite:"leftBottom"},
     {x:705,y:275,team:"B",side:"right",sprite:"rightTop"},
     {x:785,y:465,team:"B",side:"right",sprite:"rightBottom"}
   ];
   const used=items.filter(x=>x.type==="player").length;
   const slot=slots[Math.min(used,3)]||{x:350,y:350,team:t,side:"left",sprite:"leftTop"};
   const obj={id:uid(),type:"player",team:slot.team,side:slot.side,sprite:slot.sprite,x:slot.x,y:slot.y,label:String(n),name:`Jogador ${n}`,visible:true,scale:100};
   commit([...items,obj]);setSelected(obj.id);activateMode("select","Jogador adicionado e selecionado");
 };
 const addCoach=()=>{
   const obj={id:uid(),type:"coach",side:"left",x:75,y:360,label:"P",name:"Professor",sprite:"coach",visible:true,scale:100};
   commit([...items,obj]);setSelected(obj.id);activateMode("select","Professor adicionado e selecionado");
 };
 const addSimple=t=>{
   const color=t==="ball"?"#f4f72b":t==="cone"?"#ff9f1a":elementColor;
   const obj={id:uid(),type:t,x:450,y:350,name:t==="ball"?"Bola":t==="cone"?"Cone":"Texto",text:t==="text"?"Observação":"",color,visible:true,scale:100};
   commit([...items,obj]);setSelected(obj.id);activateMode("select",`${obj.name} adicionado e selecionado`);
 };
 const addStep=()=>{
   const nums=items.filter(x=>x.type==="step").map(x=>Number(x.number)||0);
   const next=(nums.length?Math.max(...nums):0)+1;
   const col=next%2===0?BLUE:LIME;
   const obj={id:uid(),type:"step",x:500,y:260,number:next,name:`Passo ${next}`,color:col,size:30,visible:true,scale:100};
   commit([...items,obj]);setSelected(obj.id);activateMode("select",`Passo ${next} adicionado ✓`);
 };
 const del=()=>{if(sel){commit(items.filter(x=>x.id!==sel.id));setSelected(null);flash("Elemento excluído")}else flash("Selecione um elemento para excluir")};
 const duplicate=()=>{if(!sel)return;const c={...clone(sel),id:uid(),x:(sel.x||0)+22,y:(sel.y||0)+22};commit([...items,c])};
 const save=()=>{localStorage.setItem("jb1551-items",JSON.stringify(items));localStorage.setItem("jb1551-scenes",JSON.stringify(scenes));localStorage.setItem("jb1551-meta",JSON.stringify({title,category,level,desc,fundamento}))};
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
 const splitPlayText=text=>{
   const normalized=text.replace(/\r/g," ").replace(/\n+/g," ").trim();
   if(!normalized)return[];
   return normalized
    .split(/(?:\.\s+|;\s*|\bpr[oó]ximo golpe\b|\bem seguida\b|\bdepois\b|\bap[oó]s isso\b|\bpor [uú]ltimo\b)/i)
    .map(x=>x.trim()).filter(x=>x.length>8);
 };
 const detectFundamento=t=>{
   const defs=[["Voleio Anômalo",/an[oô]mal/i],["Rainbow",/rainbow/i],["Smash",/smash/i],["Gancho",/gancho/i],
    ["Voleio FH",/voleio.*(?:direita|fh|forehand)/i],["Voleio BH",/voleio.*(?:esquerda|bh|backhand)/i],
    ["Curta",/curta/i],["Bandeja",/bandeja/i],["Saque",/saque/i],["Defesa",/defesa/i]];
   return defs.find(([,r])=>r.test(t))?.[0]||"Jogada";
 };
 const lineY=m=>Math.max(190,Math.min(COURT_H-45,520-(m/8)*260));
 const buildStep=(text,idx,previous)=>{
   const base=clone(previous||starter());
   const f=detectFundamento(text);
   const right=/lado direito|direita da quadra/i.test(text),left=/lado esquerdo|esquerda da quadra/i.test(text);
   const meter=Number(text.match(/linha (?:dos?|de)?\s*(\d)\s*m/i)?.[1]||0);
   let player=base.find(x=>x.type==="player"&&x.side==="left")||base.find(x=>x.type==="player");
   if(player){
     const from={x:player.x,y:player.y};
     let tx=right?430:left?250:player.x, ty=meter?lineY(meter):Math.max(255,player.y-55);
     if(/recuper|linha de base/i.test(text))ty=lineY(meter||3);
     if(/avan[cç]/i.test(text))ty=Math.max(245,ty-35);
     player.x=tx;player.y=ty;player.side=tx<500?"left":"right";
     base.push({id:uid(),type:"arrow",points:[from.x,from.y,tx,ty],color:LIME,width:6,visible:true,name:"Movimentação"});
   }
   if(/professor.*lan[cç]|lan[cç].*professor/i.test(text)){
     let coach=base.find(x=>x.type==="coach");
     if(!coach){coach={id:uid(),type:"coach",x:92,y:335,name:"Professor",visible:true,scale:100};base.push(coach)}
     const target=player||{x:420,y:320};
     base.push({id:uid(),type:"arrow",points:[coach.x+25,coach.y-40,target.x,target.y-25],color:BLUE,width:6,visible:true,name:"Bola lançada"});
     base.push({id:uid(),type:"ball",x:target.x,y:target.y-25,color:YELLOW,visible:true,name:"Bola"});
   }
   if(/cone/i.test(text)){
     const cone={id:uid(),type:"cone",x:500,y:330,color:"#ff9f1a",visible:true,name:"Cone central",scale:100};base.push(cone);
     if(player&&/dar a volta|contorn/i.test(text)){
       base.push({id:uid(),type:"curvedArrow",points:[player.x,player.y,500,390,left?310:690,player.y-40],color:LIME,width:6,visible:true,name:"Contorno do cone"});
     }
   }
   if(player){
     const endX=player.x<500?760:240;
     const high=/rainbow|lob|bola alta/i.test(text);
     base.push({id:uid(),type:high?"curvedArrow":"arrow",
       points:high?[player.x,player.y-35,(player.x+endX)/2,Math.max(70,player.y-150),endX,Math.max(100,player.y-80)]:[player.x,player.y-35,endX,Math.max(100,player.y-70)],
       color:YELLOW,width:6,visible:true,name:`Trajetória — ${f}`});
     base.push({id:uid(),type:"step",x:player.x+35,y:player.y-55,number:idx+1,name:`Etapa ${idx+1}`,color:LIME,size:30,visible:true});
     base.push({id:uid(),type:"text",x:Math.max(30,player.x-90),y:Math.max(25,player.y-105),text:f,name:f,color:"#ffffff",visible:true});
   }
   return {id:uid(),title:`${idx+1}. ${f}`,description:text,fundamento:f,items:base};
 };
 const generatePlay=()=>{
   const parts=splitPlayText(playText);
   if(!parts.length){flash("Descreva o treino antes de gerar");return}
   let previous=starter();
   const generated=parts.map((part,idx)=>{const st=buildStep(part,idx,previous);previous=clone(st.items);return st});
   setSteps(generated);setScenes(generated);setStepIndex(0);setScene(0);setItems(clone(generated[0].items));
   localStorage.setItem("jb1551-scenes",JSON.stringify(generated));
   flash(`${generated.length} etapas criadas automaticamente ✓`);
 };
 const openStep=i=>{
   if(!steps[i])return;
   const n=[...steps];
   if(n[stepIndex])n[stepIndex]={...n[stepIndex],items:clone(items)};
   setSteps(n);setScenes(n);setStepIndex(i);setScene(i);setItems(clone(n[i].items));
   localStorage.setItem("jb1551-scenes",JSON.stringify(n));
 };
 const updateStep=()=>{
   if(!steps.length)return;
   const n=[...steps];n[stepIndex]={...n[stepIndex],items:clone(items)};
   setSteps(n);setScenes(n);localStorage.setItem("jb1551-scenes",JSON.stringify(n));flash(`Etapa ${stepIndex+1} atualizada ✓`);
 };
 const deleteStep=i=>{
   const n=steps.filter((_,k)=>k!==i);
   setSteps(n);setScenes(n);const ni=Math.max(0,Math.min(stepIndex,n.length-1));setStepIndex(ni);setScene(ni);
   setItems(n[ni]?clone(n[ni].items):starter());localStorage.setItem("jb1551-scenes",JSON.stringify(n));
 };
 const sprite=i=>{
  if(i.type==="coach")return coachImg;
  if(i.sprite==="leftTop")return leftTop;
  if(i.sprite==="leftBottom")return leftBottom;
  if(i.sprite==="rightTop")return rightTop;
  if(i.sprite==="rightBottom")return rightBottom;
  return i.team==="A"?leftTop:rightTop;
 };
 const render=i=>{
  if(i.visible===false)return null;const active=i.id===selected;
  if(i.type==="player"||i.type==="coach"){
   const im=sprite(i),col=i.type==="coach"?"#fff":i.team==="A"?LIME:"#14aee8";

   if(i.type==="coach"){
     const sc=(i.scale||100)/100; const cw=104*sc,ch=184*sc;
     return <Group key={i.id} x={i.x} y={i.y} draggable={true} onMouseDown={()=>setSelected(i.id)} onTouchStart={()=>setSelected(i.id)} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y(),side:e.target.x()<500?"left":"right"})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
       {im&&<KImage image={im} x={-cw/2} y={-ch+52} width={cw} height={ch}/>}
     </Group>
   }

   const isTop=(i.side||((i.y<COURT_H/2)?"top":"bottom"))==="top";
   const sc=(i.scale||100)/100; const sw=(isTop?76:104)*sc, sh=(isTop?112:154)*sc;
   return <Group key={i.id} x={i.x} y={i.y} draggable={true} onMouseDown={()=>setSelected(i.id)} onTouchStart={()=>setSelected(i.id)} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y(),side:e.target.x()<500?"left":"right"})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
     <Group scaleX={1}>
       {im&&<KImage image={im} x={-sw/2} y={-sh+48} width={sw} height={sh}/>}
       {/* Racket is drawn separately so it can never disappear with sprite masking. */}
     </Group>
   </Group>
  }
  if(i.type==="ball")return <Circle key={i.id} x={i.x} y={i.y} radius={11} fill={i.color||"#f4f72b"} stroke={active?"#ffffff":"#182024"} shadowColor="#000" shadowBlur={6} shadowOpacity={.35} strokeWidth={3} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="cone")return <Group key={i.id} x={i.x} y={i.y} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y(),side:e.target.x()<500?"left":"right"})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}><Circle radius={17} fill="#101719" stroke={active?"#fff":"#293438"} strokeWidth={3}/><Text x={-12} y={-13} width={24} align="center" text="▲" fill={i.color||"#ff9f1a"} fontStyle="bold" fontSize={24}/></Group>;
  if(i.type==="text")return <Text key={i.id} x={i.x} y={i.y} text={i.text||"Texto"} fill="#fff" fontSize={18} draggable onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="step"){
   const r=i.size||30,stroke=active?"#ffffff":"#061014",fill=i.color||LIME;
   return <Group key={i.id} x={i.x} y={i.y} draggable={true} onMouseDown={()=>setSelected(i.id)} onTouchStart={()=>setSelected(i.id)} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragMove={e=>patch(i.id,{x:e.target.x(),y:e.target.y(),side:e.target.x()<500?"left":"right"})} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
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
        {/* V1.55.1: UMA ÚNICA arena 3D realista e limpa, sem linhas/rede/jogadores embutidos.
            O JPG contém apenas ambiente/areia/branding.
            Linhas, rede, jogadores, professor e elementos táticos são desenhados uma única vez pelo Konva. */}
        {court&&<KImage image={court} x={0} y={0} width={W} height={COURT_H}/>}

        {/* V1.54.2: layout oficial — somente linhas externas e rede vertical central. */}
        <Line points={[166,548,834,548,776,195,224,195,166,548]} stroke="#ffffff" strokeWidth={4} lineJoin="round" lineCap="round" listening={false}/>

        {items.filter(i=>!(i.type==="player"||i.type==="coach")).map(render)}
        {items.filter(i=>(i.type==="player"||i.type==="coach") && (i.side||((i.x<500)?"left":"right"))==="left").map(render)}

        {/* Rede única vertical central, como na referência oficial. */}
        <Group listening={false}>
          <Rect x={492} y={156} width={16} height={405} fill="rgba(6,12,14,.78)" stroke="#182126" strokeWidth={3}/>
          {Array.from({length:34}).map((_,k)=><Line key={"nh"+k} points={[494,164+k*11.5,506,164+k*11.5]} stroke="rgba(150,160,160,.58)" strokeWidth={1}/>)}
          {Array.from({length:5}).map((_,k)=><Line key={"nv"+k} points={[495+k*2.5,160,495+k*2.5,555]} stroke="rgba(110,120,120,.45)" strokeWidth={1}/>)}
          <Rect x={482} y={139} width={36} height={44} cornerRadius={5} fill="#11191b" stroke="#273238" strokeWidth={2}/>
          <Rect x={482} y={540} width={36} height={40} cornerRadius={5} fill="#11191b" stroke="#273238" strokeWidth={2}/>
          <Text x={486} y={153} width={28} align="center" text="JB" fill={LIME} fontSize={12} fontStyle="bold"/>
          <Text x={486} y={552} width={28} align="center" text="JB" fill={LIME} fontSize={12} fontStyle="bold"/>
        </Group>

        {items.filter(i=>(i.type==="player"||i.type==="coach") && (i.side||((i.x<500)?"left":"right"))==="right").map(render)}
        {draft?.type==="arrow"&&<Arrow points={draft.points} stroke={draft.color||arrowColor} fill={draft.color||arrowColor} strokeWidth={6} dash={[13,8]} pointerLength={17} pointerWidth={17}/>}
        {draft?.type==="zone"&&<Rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="rgba(84,230,0,.12)" stroke={LIME} strokeWidth={3}/>}
        {draft?.type==="freeDraw"&&<Line points={draft.points} stroke={draft.color||drawColor} strokeWidth={draft.width||drawWidth} lineCap="round" lineJoin="round"/>}

        {/* Card de legenda faz parte do canvas e aparece na exportação */}
        <Rect x={0} y={COURT_H} width={W} height={LEGEND_H} fill="#071116"/>
        <Rect x={18} y={COURT_H+14} width={964} height={118} cornerRadius={12} fill="#0b1b22" stroke="#203840" strokeWidth={2}/>
        <Text x={38} y={COURT_H+27} text="LEGENDA DAS CORES" fill="#ffffff" fontSize={12} fontStyle="bold" letterSpacing={2}/>
        <Circle x={56} y={COURT_H+60} radius={9} fill="#f4f72b"/>
        <Text x={76} y={COURT_H+52} text="TRAJETÓRIA DA BOLA" fill="#dbe5e8" fontSize={12} fontStyle="bold"/>
        <Circle x={374} y={COURT_H+60} radius={9} fill="#54e600"/>
        <Text x={394} y={COURT_H+52} text="MOVIMENTAÇÃO DO ALUNO" fill="#dbe5e8" fontSize={12} fontStyle="bold"/>
        <Circle x={721} y={COURT_H+60} radius={9} fill="#31b7ff"/>
        <Text x={741} y={COURT_H+52} text="BOLA LANÇADA PELO PROFESSOR" fill="#dbe5e8" fontSize={12} fontStyle="bold"/>
        <Arrow points={[55,COURT_H+105,118,COURT_H+105]} stroke="#ffffff" fill="#ffffff" strokeWidth={3} pointerLength={9} pointerWidth={9}/>
        <Text x={132} y={COURT_H+97} text="SETA RETA — BOLAS RETAS (NEUTRAS / BAIXAS)" fill="#dbe5e8" fontSize={11} fontStyle="bold"/>
        <Path x={570} y={COURT_H+91} data="M 0 20 Q 32 -10 66 18" stroke="#ffffff" strokeWidth={3} fill="transparent"/>
        <Arrow points={[624,COURT_H+103,636,COURT_H+109]} stroke="#ffffff" fill="#ffffff" strokeWidth={3} pointerLength={9} pointerWidth={9}/>
        <Text x={650} y={COURT_H+97} text="SETA CURVADA — BOLAS ALTAS (LOB)" fill="#dbe5e8" fontSize={11} fontStyle="bold"/>
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
   
 </>:<label>Cor da base <input type="color" value={sel.color||YELLOW} onChange={e=>patch(sel.id,{color:e.target.value})}/></label>}
 {sel&&(sel.type==="player"||sel.type==="coach")&&
 <label>Tamanho: {sel.scale||100}%
   <input type="range" min="60" max="160" step="5" value={sel.scale||100}
     onChange={e=>patch(sel.id,{scale:Number(e.target.value)})}/>
 </label>}<button className="dup" onClick={duplicate}><Copy/>Duplicar</button></div>}
   </aside>

   <section className="smartBuilder panel">
    <div className="smartHead"><div><h3>CRIADOR DE JOGADAS — PASSO A PASSO</h3><p>Descreva o treino. O JB Tactics separa os golpes e cria cada etapa em sequência.</p></div></div>
    <textarea className="playPrompt" value={playText} onChange={e=>setPlayText(e.target.value)}
      placeholder="Ex.: Professor lança a bola para o aluno que sai da linha dos 6m, avança e faz voleio anômalo no lado direito. Próximo golpe, recupera na linha dos 3m e faz smash na linha dos 4m. Próximo golpe, dá a volta no cone central, vai para o lado esquerdo e executa um rainbow."/>
    <button className="generatePlay" onClick={generatePlay}><ListOrdered/>Gerar jogada passo a passo</button>
    {!!steps.length&&<div className="generatedSteps">
      {steps.map((st,i)=><button key={st.id} className={"stepCard "+(i===stepIndex?"active":"")} onClick={()=>openStep(i)}>
        <b>{i+1}</b><span><strong>{st.fundamento}</strong><small>{st.description}</small></span>
        <i onClick={e=>{e.stopPropagation();deleteStep(i)}}><Trash2/></i>
      </button>)}
      <button className="updateStep" onClick={updateStep}>Salvar alterações da etapa {stepIndex+1}</button>
    </div>}
   </section>

   <section className="view panel"><h3>VISUALIZAÇÃO</h3><Toggle text="Trajetória da bola" value={showPath} set={setShowPath}/><Toggle text="Zonas da quadra" value={showZones} set={setShowZones}/><Toggle text="Logo e identidade" value={showBrand} set={setShowBrand}/></section>
  </div>
 </div>
}
function Tool({icon,text,onClick,active}){return <button type="button" className={"tool "+(active?"active":"")} onClick={onClick}>{icon}<span>{text}</span></button>}
function Toggle({text,value,set}){return <div className="toggleRow"><span>{text}</span><button type="button" className={value?"yes":""} onClick={()=>set(!value)}><i></i></button></div>}
