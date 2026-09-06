
import React,{useEffect,useMemo,useRef,useState}from"react";
import{Stage,Layer,Image as KImage,Circle,Text,Group,Arrow,Rect,Line}from"react-konva";
import{
 Grid2X2,ClipboardList,Library,Users,Settings,Cloud,Save,Share2,UserRound,GraduationCap,
 CircleDot,Triangle,MoveRight,Square,Type,MousePointer2,Move,RotateCw,Trash2,Undo2,Redo2,
 Eye,EyeOff,Play,Square as StopSquare,Plus,Pencil,ChevronLeft,ChevronRight,Download,
 Copy,ImageDown,PanelTop,FolderOpen
}from"lucide-react";

const W=1000,H=520, LIME="#54e600", BLUE="#31b7ff", YELLOW="#f4f72b";
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clone=o=>JSON.parse(JSON.stringify(o));
function useAsset(src){const[i,setI]=useState(null);useEffect(()=>{const x=new Image();x.src=src;x.onload=()=>setI(x)},[src]);return i}
const starter=()=>[
 {id:uid(),type:"player",team:"A",x:300,y:360,label:"1",name:"Jogador 1",sprite:"back",facing:"right",visible:true},
 {id:uid(),type:"player",team:"A",x:700,y:360,label:"2",name:"Jogador 2",sprite:"back",facing:"left",visible:true},
 {id:uid(),type:"player",team:"B",x:300,y:155,label:"3",name:"Jogador 3",sprite:"front",facing:"right",visible:true},
 {id:uid(),type:"player",team:"B",x:700,y:155,label:"4",name:"Jogador 4",sprite:"front",facing:"left",visible:true},
 {id:uid(),type:"coach",x:78,y:330,label:"P",name:"Professor",sprite:"coach",facing:"right",visible:true}
];

export default function App(){
 const stageRef=useRef(), boxRef=useRef();
 const court=useAsset("/assets/premium-court.jpg"),front=useAsset("/assets/player_front.png"),back=useAsset("/assets/player_back.png"),coachImg=useAsset("/assets/coach_reference.jpg");
 const[items,setItems]=useState(()=>{try{return JSON.parse(localStorage.getItem("jb117-items"))||starter()}catch{return starter()}});
 const[selected,setSelected]=useState(null),[teamTab,setTeamTab]=useState("A"),[mode,setMode]=useState("select"),[draft,setDraft]=useState(null);
 const[history,setHistory]=useState([]),[future,setFuture]=useState([]),[scale,setScale]=useState(1);
 const[title,setTitle]=useState("Saque + subida"),[category,setCategory]=useState("Ofensiva"),[level,setLevel]=useState("Intermediário"),[desc,setDesc]=useState("Saque profundo no meio + subida para a rede.");
 const[scenes,setScenes]=useState(()=>{try{return JSON.parse(localStorage.getItem("jb117-scenes"))||[]}catch{return[]}});
 const[scene,setScene]=useState(0),[showPath,setShowPath]=useState(true),[showZones,setShowZones]=useState(true),[showNums,setShowNums]=useState(true),[showBrand,setShowBrand]=useState(true);
 const[playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[courtMode,setCourtMode]=useState("full");
 const[arrowColor,setArrowColor]=useState("#f4f72b");
 const[fundamento,setFundamento]=useState("Saque");
 const fundamentos=["Saque","Smash","Bandeja","Voleio FH","Voleio BH","Curta","Gancho","Anômalo","Rainbow","Defesa","Topspin","Slice","Drive","Flat","Swing Volley","Fast Hands"];

 useEffect(()=>{const r=()=>boxRef.current&&setScale(Math.min(1,boxRef.current.clientWidth/W));r();addEventListener("resize",r);return()=>removeEventListener("resize",r)},[]);
 useEffect(()=>{if(!playing)return;const t=setInterval(()=>setProgress(p=>p>=100?(setPlaying(false),0):p+1),100);return()=>clearInterval(t)},[playing]);
 const sel=useMemo(()=>items.find(x=>x.id===selected),[items,selected]);
 const commit=n=>{setHistory(h=>[...h,clone(items)].slice(-40));setItems(n);setFuture([])};
 const patch=(id,p)=>setItems(v=>v.map(x=>x.id===id?{...x,...p}:x));
 const undo=()=>{if(!history.length)return;setFuture(f=>[clone(items),...f]);setItems(history.at(-1));setHistory(h=>h.slice(0,-1))};
 const redo=()=>{if(!future.length)return;setHistory(h=>[...h,clone(items)]);setItems(future[0]);setFuture(f=>f.slice(1))};
 const addPlayer=t=>{let n=items.filter(x=>x.type==="player").length+1;commit([...items,{id:uid(),type:"player",team:t,x:450,y:t==="A"?445:230,label:String(n),name:`Jogador ${n}`,sprite:t==="A"?"back":"front",facing:t==="A"?"right":"left",visible:true}])};
 const addCoach=()=>commit([...items,{id:uid(),type:"coach",x:78,y:330,label:"P",name:"Professor",sprite:"coach",rotation:0,visible:true}]);
 const addSimple=t=>commit([...items,{id:uid(),type:t,x:450,y:350,name:t==="ball"?"Bola":t==="cone"?"Cone":"Texto",text:t==="text"?"Observação":"",visible:true}]);
 const del=()=>{if(sel){commit(items.filter(x=>x.id!==sel.id));setSelected(null)}};
 const duplicate=()=>{if(!sel)return;const c={...clone(sel),id:uid(),x:(sel.x||0)+22,y:(sel.y||0)+22};commit([...items,c])};
 const save=()=>{localStorage.setItem("jb117-items",JSON.stringify(items));localStorage.setItem("jb117-scenes",JSON.stringify(scenes));localStorage.setItem("jb117-meta",JSON.stringify({title,category,level,desc,fundamento}))};
 const exportPNG=()=>{const a=document.createElement("a");a.href=stageRef.current.toDataURL({pixelRatio:2});a.download=title.replace(/\W+/g,"_")+".png";a.click()};
 const point=()=>{const p=stageRef.current?.getPointerPosition();return p?{x:p.x/scale,y:p.y/scale}:null};
 const down=()=>{if(!["arrow","zone"].includes(mode))return;const p=point();if(!p)return;if(mode==="arrow")setDraft({type:"arrow",points:[p.x,p.y,p.x,p.y],color:arrowColor});else setDraft({type:"zone",x:p.x,y:p.y,w:0,h:0})};
 const move=()=>{if(!draft)return;const p=point();if(!p)return;if(draft.type==="arrow")setDraft(d=>({...d,points:[d.points[0],d.points[1],p.x,p.y]}));else setDraft(d=>({...d,w:p.x-d.x,h:p.y-d.y}))};
 const up=()=>{if(!draft)return;if(draft.type==="arrow")commit([...items,{id:uid(),type:"arrow",points:draft.points,color:draft.color||arrowColor,visible:true}]);else commit([...items,{id:uid(),type:"zone",x:draft.x,y:draft.y,w:draft.w,h:draft.h,color:LIME,visible:true}]);setDraft(null);setMode("select")};
 const newScene=()=>{const next=[...scenes,{id:uid(),title:`Cena ${scenes.length+1}`,items:clone(items)}];setScenes(next);setScene(next.length-1)};
 const updateScene=()=>{let n=[...scenes],s={id:n[scene]?.id||uid(),title:`Cena ${scene+1}`,items:clone(items)};if(!n.length)n=[s];else n[scene]=s;setScenes(n)};
 const openScene=i=>{if(scenes[i]){setScene(i);setItems(clone(scenes[i].items))}};
 const sprite=i=>{
  if(i.type==="coach") return coachImg;
  if(i.facing==="down") return front;
  if(i.facing==="up") return back;
  return front;
};

 const render=i=>{
  if(i.visible===false)return null;const active=i.id===selected;
  if(i.type==="player"||i.type==="coach"){
   const im=sprite(i),col=i.type==="coach"?"#fff":i.team==="A"?LIME:"#14aee8";
   const face=i.facing|| (i.team==="A"?"right":"left");
   const mirror=face==="left"?-1:1;

   if(i.type==="coach"){
     const cw=126,ch=164;
     return <Group key={i.id} x={i.x} y={i.y} draggable={mode==="select"} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
       <Rect x={-cw/2-5} y={-ch+48-5} width={cw+10} height={ch+10} cornerRadius={8} fill="#111b20" stroke={active?"#fff":"#263941"} strokeWidth={active?3:1}/>
       {im&&<KImage image={im} x={-cw/2} y={-ch+48} width={cw} height={ch}/>}
       {showNums&&<><Circle x={45} y={-58} radius={16} fill="#14351b" stroke="#fff" strokeWidth={3}/><Text x={29} y={-65} width={32} align="center" text="P" fill="#fff" fontStyle="bold" fontSize={12}/></>}
     </Group>
   }

   const sw=92,sh=150;
   return <Group key={i.id} x={i.x} y={i.y} draggable={mode==="select"} onClick={()=>setSelected(i.id)} onTap={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}>
     <Group scaleX={mirror}>
       {im&&<KImage image={im} x={mirror===-1?sw/2:-sw/2} y={-sh+48} width={sw} height={sh}/>}
       {/* Racket is drawn separately so it can never disappear with sprite masking. */}
       <Line points={[25,-44,42,-62]} stroke="#20262b" strokeWidth={5} lineCap="round"/>
       <Circle x={49} y={-69} radius={15} scaleY={1.22} stroke="#151b20" strokeWidth={5}/>
       <Line points={[39,-78,58,-60]} stroke="#59666c" strokeWidth={1}/>
       <Line points={[39,-60,58,-78]} stroke="#59666c" strokeWidth={1}/>
     </Group>
     {showNums&&<><Circle x={34} y={-55} radius={16} fill="#14351b" stroke={col} strokeWidth={3}/><Text x={18} y={-62} width={32} align="center" text={i.label} fill="#fff" fontStyle="bold" fontSize={12}/></>}
   </Group>
  }
  if(i.type==="ball")return <Circle key={i.id} x={i.x} y={i.y} radius={11} fill="#f5f7e9" stroke={active?LIME:"#65747a"} strokeWidth={3} draggable onClick={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="cone")return <Group key={i.id} x={i.x} y={i.y} draggable onClick={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}><Circle radius={16} fill="#f4a51c"/><Text x={-9} y={-9} text="▲" fill="#fff" fontSize={18}/></Group>;
  if(i.type==="text")return <Text key={i.id} x={i.x} y={i.y} text={i.text||"Texto"} fill="#fff" fontSize={18} draggable onClick={()=>setSelected(i.id)} onDragEnd={e=>patch(i.id,{x:e.target.x(),y:e.target.y()})}/>;
  if(i.type==="arrow"&&showPath)return <Arrow key={i.id} points={i.points} stroke={active?"#fff":i.color||YELLOW} fill={active?"#fff":i.color||YELLOW} strokeWidth={6} dash={[13,8]} pointerLength={17} pointerWidth={17} draggable onClick={()=>setSelected(i.id)}/>;
  if(i.type==="zone"&&showZones)return <Rect key={i.id} x={i.x} y={i.y} width={i.w} height={i.h} fill="rgba(84,230,0,.12)" stroke={active?"#fff":i.color||LIME} strokeWidth={3} draggable onClick={()=>setSelected(i.id)}/>;
 };

 const playerList=items.filter(x=>teamTab==="P"?x.type==="coach":x.type==="player"&&x.team===teamTab);

 return <div className="app">
  <header className="top">
   <div className="logo"><b>JB</b><div><strong>JB TACTICS</strong><small>BEACH TENNIS</small></div></div>
   <nav className="navtabs"><button className="navactive"><Grid2X2/>Táticas</button><button><ClipboardList/>Exercícios</button><button><Library/>Biblioteca</button><button><Users/>Alunos</button><button><Settings/>Configurações</button></nav>
   <div className="actions"><button className="cloud"><Cloud/></button><button className="save" onClick={save}><Save/>Salvar</button><button className="export" onClick={exportPNG}><Share2/>Exportar</button></div>
  </header>

  <div className="studio">
   <aside className="left panel">
    <h3>MODO DE QUADRA</h3><div className="seg"><button className={courtMode==="full"?"on":""} onClick={()=>setCourtMode("full")}>Quadra inteira</button><button className={courtMode==="half"?"on":""} onClick={()=>setCourtMode("half")}>Meia quadra</button></div>
    <h3>ELEMENTOS</h3>
    <Tool icon={<UserRound/>} text="Jogador 3D" onClick={()=>addPlayer(teamTab==="B"?"B":"A")}/><Tool icon={<GraduationCap/>} text="Professor" onClick={addCoach}/><Tool icon={<CircleDot/>} text="Bola" onClick={()=>addSimple("ball")}/><Tool icon={<Triangle/>} text="Cone" onClick={()=>addSimple("cone")}/><Tool icon={<MoveRight/>} text="Seta" onClick={()=>setMode("arrow")}/>
    <div className="quickArrowColors">
      {["#f4f72b","#54e600","#31b7ff","#ff4d4f","#ffffff"].map(c=><button key={c} className={arrowColor===c?"picked":""} style={{background:c}} onClick={()=>{setArrowColor(c);if(sel?.type==="arrow")patch(sel.id,{color:c})}} title="Cor da seta"></button>)}
    </div>
    <Tool icon={<Square/>} text="Área / Zona" onClick={()=>setMode("zone")}/><Tool icon={<Type/>} text="Texto" onClick={()=>addSimple("text")}/>
    <h3>FERRAMENTAS</h3>
    <Tool active={mode==="select"} icon={<MousePointer2/>} text="Selecionar" onClick={()=>setMode("select")}/><Tool icon={<Move/>} text="Mover" onClick={()=>setMode("select")}/><Tool icon={<RotateCw/>} text="Orientar corpo" onClick={()=>{if(sel&&(sel.type==="player"||sel.type==="coach")){const order=["down","right","up","left"];const n=(order.indexOf(sel.facing||"down")+1)%order.length;patch(sel.id,{facing:order[n]})}}}/><Tool icon={<Trash2/>} text="Excluir" onClick={del}/><Tool icon={<Undo2/>} text="Desfazer" onClick={undo}/><Tool icon={<Redo2/>} text="Refazer" onClick={redo}/>
   </aside>

   <main className="center">
    <div className="sceneTop"><button onClick={()=>openScene(Math.max(0,scene-1))}><ChevronLeft/></button><div><b>{title}</b><span>{scene+1} / {Math.max(1,scenes.length)}</span></div><button onClick={()=>openScene(Math.min(scenes.length-1,scene+1))}><ChevronRight/></button></div>
    <div className="courtBox" ref={boxRef} style={{height:H*scale}}>
     <div style={{width:W*scale,height:H*scale}}>
      <Stage ref={stageRef} width={W*scale} height={H*scale} scaleX={scale} scaleY={scale} onMouseDown={down} onTouchStart={down} onMouseMove={move} onTouchMove={move} onMouseUp={up} onTouchEnd={up}>
       <Layer>
        {court&&<KImage image={court} width={W} height={H}/>}
        
        
        {items.map(render)}
        {draft?.type==="arrow"&&<Arrow points={draft.points} stroke={draft.color||arrowColor} fill={draft.color||arrowColor} strokeWidth={6} dash={[13,8]} pointerLength={17} pointerWidth={17}/>}
        {draft?.type==="zone"&&<Rect x={draft.x} y={draft.y} width={draft.w} height={draft.h} fill="rgba(84,230,0,.12)" stroke={LIME} strokeWidth={3}/>}
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

   <section className="view panel"><h3>VISUALIZAÇÃO</h3><Toggle text="Trajetória da bola" value={showPath} set={setShowPath}/><Toggle text="Zonas da quadra" value={showZones} set={setShowZones}/><Toggle text="Números dos jogadores" value={showNums} set={setShowNums}/><Toggle text="Logo e identidade" value={showBrand} set={setShowBrand}/></section>
  </div>
 </div>
}
function Tool({icon,text,onClick,active}){return <button className={"tool "+(active?"active":"")} onClick={onClick}>{icon}<span>{text}</span></button>}
function Toggle({text,value,set}){return <div className="toggleRow"><span>{text}</span><button className={value?"yes":""} onClick={()=>set(!value)}><i></i></button></div>}
