import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage, Layer, Rect, Line, Circle, Text, Arrow, Group
} from "react-konva";
import {
  UserPlus, CircleDot, Triangle, MoveUpRight, Trash2, Save, Download,
  Undo2, Redo2, GraduationCap, Type, Copy, MousePointer2, Library,
  Plus, FolderOpen, Eye, EyeOff, Printer, Home, Waves, RotateCcw,
  Columns2, RectangleHorizontal, BadgeHelp, Palette, ImageDown,
  Play, ChevronLeft, ChevronRight, Film, Layers3
} from "lucide-react";

const DESIGN_W = 900;
const DESIGN_H = 600;
const COURT_FULL = { x: 70, y: 44, width: 760, height: 510 };
const COURT_HALF = { x: 120, y: 60, width: 660, height: 480 };

const C = {
  lime:"#B8FF00", blue:"#31B7FF", amber:"#FFB000",
  ball:"#FFD60A", cone:"#FF7A00", dark:"#101318",
  attack:"#FF4D4F", defense:"#31B7FF", movement:"#FFFFFF", ballPath:"#FFD60A"
};

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const blankMeta = {
  title:"Nova tática",
  category:"Construção",
  level:"Intermediário",
  notes:"",
  courtMode:"full"
};

const starterBoard = () => [
  {id:id(),type:"player",team:"A",x:300,y:410,label:"A1",color:C.lime,size:24,shape:"human"},
  {id:id(),type:"player",team:"A",x:600,y:410,label:"A2",color:C.lime,size:24,shape:"human"},
  {id:id(),type:"player",team:"B",x:300,y:190,label:"B1",color:C.blue,size:24,shape:"human"},
  {id:id(),type:"player",team:"B",x:600,y:190,label:"B2",color:C.blue,size:24,shape:"human"}
];

const templates = [
  {
    id:"saque-subida", title:"Saque + subida", category:"Saque", level:"Intermediário",
    notes:"Saque direcionado e avanço coordenado da dupla.",
    build:()=>[
      ...starterBoard(),
      {id:id(),type:"ball",x:300,y:390,size:13},
      {id:id(),type:"curve",points:[300,390,330,340,375,300,410,260],color:C.ballPath,width:5,dashed:false,label:"Trajetória da bola"},
      {id:id(),type:"arrow",points:[300,410,300,330],color:C.movement,width:6,dashed:true,label:"Movimento"},
      {id:id(),type:"arrow",points:[600,410,590,330],color:C.movement,width:6,dashed:true,label:"Movimento"}
    ]
  },
  {
    id:"devolucao-cruzada", title:"Devolução cruzada", category:"Recepção", level:"Iniciante",
    notes:"Direcionar a devolução cruzada e recuperar posição.",
    build:()=>[
      ...starterBoard(),
      {id:id(),type:"ball",x:600,y:210,size:13},
      {id:id(),type:"curve",points:[600,210,540,260,450,320,310,390],color:C.ballPath,width:5,dashed:false,label:"Trajetória da bola"}
    ]
  },
  {
    id:"defesa-transicao", title:"Defesa + transição", category:"Defesa", level:"Avançado",
    notes:"Defender no fundo e avançar para zona de construção.",
    build:()=>[
      ...starterBoard(),
      {id:id(),type:"arrow",points:[300,190,330,280],color:C.defense,width:6,dashed:true,label:"Movimento defensivo"},
      {id:id(),type:"arrow",points:[600,190,565,280],color:C.defense,width:6,dashed:true,label:"Movimento defensivo"},
      {id:id(),type:"curve",points:[450,330,430,280,400,250,360,230],color:C.ballPath,width:5,dashed:false,label:"Trajetória da bola"}
    ]
  }
];

function loadJSON(key, fallback){
  try{
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  }catch{return fallback}
}

export default function App(){
  const stageRef = useRef(null);
  const stageBoxRef = useRef(null);

  const [view,setView] = useState("home");
  const [items,setItems] = useState(()=>loadJSON("jb-v15-board", starterBoard()));
  const [meta,setMeta] = useState(()=>loadJSON("jb-v15-meta", blankMeta));
  const [library,setLibrary] = useState(()=>loadJSON("jb-v15-library", []));
  const [selectedId,setSelectedId] = useState(null);
  const [history,setHistory] = useState([]);
  const [future,setFuture] = useState([]);
  const [showZones,setShowZones] = useState(true);
  const [drawMode,setDrawMode] = useState(null);
  const [draft,setDraft] = useState(null);
  const [scale,setScale] = useState(1);
  const [status,setStatus] = useState("Pronto");
  const [scenes,setScenes] = useState(()=>loadJSON("jb-v16-scenes", []));
  const [sceneIndex,setSceneIndex] = useState(0);
  const [presenting,setPresenting] = useState(false);

  const selected = useMemo(()=>items.find(i=>i.id===selectedId)||null,[items,selectedId]);
  const court = meta.courtMode === "half" ? COURT_HALF : COURT_FULL;

  useEffect(()=>{
    const resize = ()=>{
      if(!stageBoxRef.current) return;
      const w = stageBoxRef.current.clientWidth;
      const next = Math.min(1, Math.max(.45, w / DESIGN_W));
      setScale(next);
    };
    resize();
    window.addEventListener("resize",resize);
    return ()=>window.removeEventListener("resize",resize);
  },[view]);

  const commit=(next,msg)=>{
    setHistory(h=>[...h,items].slice(-40));
    setItems(next); setFuture([]); if(msg)setStatus(msg);
  };
  const add=(obj,msg)=>commit([...items,obj],msg);
  const update=(itemId,patch)=>setItems(v=>v.map(i=>i.id===itemId?{...i,...patch}:i));

  const undo=()=>{
    if(!history.length)return;
    const prev=history[history.length-1];
    setFuture(f=>[items,...f]); setItems(prev); setHistory(h=>h.slice(0,-1)); setSelectedId(null);
  };
  const redo=()=>{
    if(!future.length)return;
    const next=future[0];
    setHistory(h=>[...h,items]); setItems(next); setFuture(f=>f.slice(1)); setSelectedId(null);
  };

  const addPlayer=(team)=>{
    const n=items.filter(i=>i.type==="player"&&i.team===team).length+1;
    add({id:id(),type:"player",team,x:team==="A"?360:540,y:team==="A"?420:180,label:`${team}${n}`,color:team==="A"?C.lime:C.blue,size:24,shape:"human"},"Jogador adicionado");
  };
  const addCoach=()=>add({id:id(),type:"coach",x:450,y:520,label:"Professor",color:C.amber,size:24,shape:"human"},"Professor adicionado");
  const addBall=()=>add({id:id(),type:"ball",x:450,y:300,size:13},"Bola adicionada");
  const addCone=()=>add({id:id(),type:"cone",x:520,y:300,size:16},"Cone adicionado");
  const addNote=()=>add({id:id(),type:"note",x:120,y:90,text:"Observação",color:"#fff"},"Texto adicionado");

  const del=()=>{
    if(!selectedId)return;
    commit(items.filter(i=>i.id!==selectedId),"Elemento excluído");
    setSelectedId(null);
  };
  const dup=()=>{
    if(!selected)return;
    const cp={...selected,id:id()};
    if("x" in cp){cp.x+=25;cp.y+=25}
    if(cp.points) cp.points=cp.points.map((v,idx)=>v+25);
    add(cp,"Elemento duplicado");
  };

  const saveCurrent=()=>{
    localStorage.setItem("jb-v15-board",JSON.stringify(items));
    localStorage.setItem("jb-v15-meta",JSON.stringify(meta));
    setStatus("Tática salva");
  };
  const saveLibrary=()=>{
    const entry={id:id(),...meta,items,updatedAt:new Date().toISOString()};
    const next=[entry,...library];
    setLibrary(next); localStorage.setItem("jb-v15-library",JSON.stringify(next));
    setStatus("Salvo na biblioteca");
  };
  const loadEntry=(entry)=>{
    setItems(entry.items||[]);
    setMeta({
      title:entry.title||"Tática",
      category:entry.category||"Construção",
      level:entry.level||"Intermediário",
      notes:entry.notes||"",
      courtMode:entry.courtMode||"full"
    });
    setView("editor"); setSelectedId(null); setHistory([]); setFuture([]);
  };
  const useTemplate=(tpl)=>{
    setItems(tpl.build());
    setMeta({title:tpl.title,category:tpl.category,level:tpl.level,notes:tpl.notes,courtMode:"full"});
    setView("editor"); setSelectedId(null); setHistory([]); setFuture([]);
  };

  const snapshotScene = () => ({
    id:id(),
    title:`Passo ${scenes.length+1}`,
    items:JSON.parse(JSON.stringify(items)),
    meta:JSON.parse(JSON.stringify(meta))
  });

  const syncScenes = (next) => {
    setScenes(next);
    localStorage.setItem("jb-v16-scenes",JSON.stringify(next));
  };

  const addScene = () => {
    const next=[...scenes,snapshotScene()];
    syncScenes(next);
    setSceneIndex(next.length-1);
    setStatus("Novo passo criado");
  };

  const duplicateScene = () => {
    const baseScene=scenes[sceneIndex] || snapshotScene();
    const copy={...JSON.parse(JSON.stringify(baseScene)),id:id(),title:`Passo ${scenes.length+1}`};
    const next=[...scenes,copy];
    syncScenes(next);
    setSceneIndex(next.length-1);
    setItems(copy.items);
    setMeta(copy.meta);
    setStatus("Cena duplicada");
  };

  const saveScene = () => {
    let next=[...scenes];
    const scene={id:next[sceneIndex]?.id||id(),title:`Passo ${sceneIndex+1}`,items:JSON.parse(JSON.stringify(items)),meta:JSON.parse(JSON.stringify(meta))};
    if(next.length===0){next=[scene];setSceneIndex(0)}
    else next[sceneIndex]=scene;
    syncScenes(next);
    setStatus("Passo atualizado");
  };

  const openScene = (idx) => {
    const scene=scenes[idx]; if(!scene)return;
    setSceneIndex(idx);
    setItems(JSON.parse(JSON.stringify(scene.items)));
    setMeta(JSON.parse(JSON.stringify(scene.meta)));
    setSelectedId(null);
  };

  const deleteScene = (idx) => {
    if(!scenes.length)return;
    const next=scenes.filter((_,i)=>i!==idx);
    syncScenes(next);
    const ni=Math.max(0,Math.min(idx,next.length-1));
    setSceneIndex(ni);
    if(next[ni]){setItems(JSON.parse(JSON.stringify(next[ni].items)));setMeta(JSON.parse(JSON.stringify(next[ni].meta)))}
    setStatus("Passo removido");
  };

  const exportPNG=()=>{
    const uri=stageRef.current.toDataURL({pixelRatio:2});
    const a=document.createElement("a");
    a.href=uri;
    a.download=`${meta.title.replace(/[^\w\-]+/g,"_")}.png`;
    document.body.appendChild(a);a.click();a.remove();
  };

  const pointer=()=>{
    const p=stageRef.current?.getPointerPosition(); if(!p)return null;
    return {
      x:Math.max(court.x,Math.min(court.x+court.width,p.x/scale)),
      y:Math.max(court.y,Math.min(court.y+court.height,p.y/scale))
    };
  };

  const onDown=()=>{
    if(!drawMode)return;
    const p=pointer(); if(!p)return;
    if(drawMode==="movement") setDraft({type:"arrow",points:[p.x,p.y,p.x,p.y],color:C.movement,dashed:true,label:"Movimento"});
    if(drawMode==="attack") setDraft({type:"arrow",points:[p.x,p.y,p.x,p.y],color:C.attack,dashed:false,label:"Ataque"});
    if(drawMode==="defense") setDraft({type:"arrow",points:[p.x,p.y,p.x,p.y],color:C.defense,dashed:true,label:"Defesa"});
    if(drawMode==="ballpath") setDraft({type:"curve",points:[p.x,p.y,p.x,p.y,p.x,p.y,p.x,p.y],color:C.ballPath,dashed:false,label:"Trajetória da bola"});
  };

  const onMove=()=>{
    if(!drawMode||!draft)return;
    const p=pointer(); if(!p)return;
    if(draft.type==="arrow"){
      setDraft(d=>({...d,points:[d.points[0],d.points[1],p.x,p.y]}));
    }else{
      const sx=draft.points[0], sy=draft.points[1];
      const mx=(sx+p.x)/2, my=(sy+p.y)/2;
      setDraft(d=>({...d,points:[sx,sy,mx-35,my+15,mx+30,my-20,p.x,p.y]}));
    }
  };

  const onUp=()=>{
    if(!draft)return;
    const pts=draft.points;
    const dx=pts[pts.length-2]-pts[0],dy=pts[pts.length-1]-pts[1];
    if(Math.hypot(dx,dy)>20){
      add({id:id(),...draft,width:5},draft.label+" desenhada");
    }
    setDraft(null);
  };

  const handlePointDrag=(item,index,e)=>{
    const pts=[...item.points];
    pts[index]=e.target.x(); pts[index+1]=e.target.y();
    update(item.id,{points:pts});
  };

  const renderHuman = (item,active) => (
    <Group>
      <Circle y={-10} radius={(item.size||24)*0.42} fill={item.color} stroke={active?"#fff":C.dark} strokeWidth={active?4:2}/>
      <Rect x={-(item.size||24)*0.52} y={0} width={(item.size||24)*1.04} height={(item.size||24)*1.18}
        cornerRadius={8} fill={item.color} stroke={active?"#fff":C.dark} strokeWidth={active?4:2}/>
      <Text x={-26} y={7} width={52} align="center" text={item.label||""} fill={C.dark} fontStyle="bold" fontSize={12} listening={false}/>
    </Group>
  );

  const renderItem=(item)=>{
    const active=item.id===selectedId;

    if(item.type==="player"||item.type==="coach"){
      return (
        <Group key={item.id} x={item.x} y={item.y} draggable={!drawMode}
          onClick={()=>!drawMode&&setSelectedId(item.id)} onTap={()=>!drawMode&&setSelectedId(item.id)}
          onDragEnd={e=>update(item.id,{x:e.target.x(),y:e.target.y()})}>
          {renderHuman(item,active)}
        </Group>
      );
    }
    if(item.type==="ball"){
      return <Circle key={item.id} x={item.x} y={item.y} radius={item.size||13} fill={C.ball}
        stroke={active?"#fff":C.dark} strokeWidth={active?5:2} draggable={!drawMode}
        onClick={()=>!drawMode&&setSelectedId(item.id)} onTap={()=>!drawMode&&setSelectedId(item.id)}
        onDragEnd={e=>update(item.id,{x:e.target.x(),y:e.target.y()})}/>;
    }
    if(item.type==="cone"){
      return <Group key={item.id} x={item.x} y={item.y} draggable={!drawMode}
        onClick={()=>!drawMode&&setSelectedId(item.id)} onTap={()=>!drawMode&&setSelectedId(item.id)}
        onDragEnd={e=>update(item.id,{x:e.target.x(),y:e.target.y()})}>
        <Circle radius={item.size||16} fill={C.cone} stroke={active?"#fff":"#7c3300"} strokeWidth={active?5:2}/>
        <Text x={-10} y={-8} text="▲" fill="#fff" fontSize={18} listening={false}/>
      </Group>;
    }
    if(item.type==="note"){
      return <Text key={item.id} x={item.x} y={item.y} text={item.text} fill={item.color||"#fff"} fontSize={18}
        fontStyle="bold" padding={6} draggable={!drawMode}
        onClick={()=>!drawMode&&setSelectedId(item.id)} onTap={()=>!drawMode&&setSelectedId(item.id)}
        onDragEnd={e=>update(item.id,{x:e.target.x(),y:e.target.y()})}/>;
    }
    if(item.type==="arrow"||item.type==="curve"){
      const isCurve=item.type==="curve";
      return (
        <React.Fragment key={item.id}>
          <Arrow points={item.points} stroke={active?C.lime:item.color||"#fff"} fill={active?C.lime:item.color||"#fff"}
            strokeWidth={item.width||5} pointerLength={16} pointerWidth={16}
            tension={isCurve?.45:0} dash={item.dashed?[14,10]:[]}
            draggable={!drawMode}
            onClick={()=>!drawMode&&setSelectedId(item.id)} onTap={()=>!drawMode&&setSelectedId(item.id)}
            onDragEnd={e=>{
              const dx=e.target.x(),dy=e.target.y();
              update(item.id,{points:item.points.map((v,idx)=>v+(idx%2===0?dx:dy))});
              e.target.position({x:0,y:0});
            }}/>
          {active && !drawMode && (
            <>
              <Circle x={item.points[0]} y={item.points[1]} radius={8} fill={C.lime} stroke="#111" strokeWidth={2} draggable
                onDragMove={e=>handlePointDrag(item,0,e)}/>
              <Circle x={item.points[item.points.length-2]} y={item.points[item.points.length-1]} radius={8} fill={C.lime} stroke="#111" strokeWidth={2} draggable
                onDragMove={e=>handlePointDrag(item,item.points.length-2,e)}/>
            </>
          )}
        </React.Fragment>
      );
    }
    return null;
  };

  const renderLegend = () => (
    <Group x={650} y={485}>
      <Rect x={0} y={0} width={180} height={82} cornerRadius={10} fill="#111820" opacity={.9}/>
      <Line points={[12,20,42,20]} stroke={C.movement} strokeWidth={4} dash={[8,6]}/>
      <Text x={50} y={13} text="Movimento" fill="#fff" fontSize={12}/>
      <Line points={[12,40,42,40]} stroke={C.attack} strokeWidth={4}/>
      <Text x={50} y={33} text="Ataque" fill="#fff" fontSize={12}/>
      <Line points={[12,60,42,60]} stroke={C.ballPath} strokeWidth={4}/>
      <Text x={50} y={53} text="Trajetória bola" fill="#fff" fontSize={12}/>
    </Group>
  );

  if(presenting){
    const total=Math.max(scenes.length,1);
    return (
      <div className="presentation">
        <div className="presentation-top">
          <div><strong>JB Tactics</strong><span>{meta.title}</span></div>
          <button className="secondary" onClick={()=>setPresenting(false)}>Sair da apresentação</button>
        </div>
        <div className="presentation-stage">
          <div className="presentation-label">PASSO {sceneIndex+1} DE {total}</div>
          <div className="presentation-card">
            <Stage width={900} height={600}>
              <Layer>
                <Rect x={0} y={0} width={900} height={600} fill="#20242b"/>
                <Rect x={court.x} y={court.y} width={court.width} height={court.height} fill="#e3cf97" stroke="#fff" strokeWidth={4}/>
                {meta.courtMode==="full"&&<Line points={[court.x,court.y+court.height/2,court.x+court.width,court.y+court.height/2]} stroke="#4e5155" strokeWidth={5}/>}
                <Line points={[court.x+court.width/2,court.y,court.x+court.width/2,court.y+court.height]} stroke="#fff" strokeWidth={2} opacity={.65}/>
                {items.map(renderItem)}
                {renderLegend()}
              </Layer>
            </Stage>
          </div>
          <div className="presentation-nav">
            <button className="secondary" disabled={sceneIndex<=0} onClick={()=>openScene(sceneIndex-1)}><ChevronLeft/>Anterior</button>
            <div className="scene-dots">{Array.from({length:total}).map((_,i)=><i key={i} className={i===sceneIndex?"active":""}></i>)}</div>
            <button disabled={sceneIndex>=total-1} onClick={()=>openScene(sceneIndex+1)}>Próximo<ChevronRight/></button>
          </div>
        </div>
      </div>
    );
  }

  if(view==="home"){
    return (
      <div className="app home-page">
        <header className="home-top">
          <div className="brand">
            <div className="brandmark">JB</div>
            <div><h1>JB Tactics <span>PRO</span></h1><p>Planejamento tático de Beach Tennis</p></div>
          </div>
          <button className="secondary" onClick={()=>setView("library")}><Library size={18}/>Biblioteca</button>
        </header>

        <section className="hero">
          <span className="eyebrow">COACH SUITE</span>
          <h2>Planeje a jogada. Mostre o movimento. Ensine melhor.</h2>
          <p>Uma prancheta visual para organizar posicionamento, movimentações, trajetórias e conceitos táticos em quadra.</p>
          <div className="hero-actions">
            <button onClick={()=>{setItems(starterBoard());setMeta(blankMeta);setView("editor")}}><Plus size={19}/>Nova tática</button>
            <button className="secondary" onClick={()=>setView("library")}><FolderOpen size={19}/>Abrir biblioteca</button>
          </div>
        </section>

        <section className="template-section">
          <div className="section-head"><div><span className="eyebrow">MODELOS</span><h3>Comece por uma jogada pronta</h3></div></div>
          <div className="template-grid">
            {templates.map(t=>(
              <article className="template-card" key={t.id}>
                <div className="court-mini"></div>
                <div className="card-badge">{t.level}</div>
                <h4>{t.title}</h4><p>{t.category}</p>
                <button onClick={()=>useTemplate(t)}>Usar modelo</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if(view==="library"){
    return (
      <div className="app">
        <header className="topbar">
          <div className="brand"><div className="brandmark">JB</div><div><h1>JB Tactics <span>PRO</span></h1><p>Biblioteca</p></div></div>
          <div className="top-actions">
            <button className="secondary" onClick={()=>setView("home")}><Home size={18}/>Início</button>
            <button onClick={()=>setView("editor")}><Plus size={18}/>Editor</button>
          </div>
        </header>
        <div className="library-page">
          <div className="library-head"><div><span className="eyebrow">BIBLIOTECA</span><h2>Suas táticas</h2></div><span>{library.length} salva(s)</span></div>
          {library.length===0?<div className="library-empty"><Library size={44}/><h3>Nenhuma tática salva</h3><p>Salve suas jogadas pelo editor para elas aparecerem aqui.</p></div>:
          <div className="library-grid">{library.map(e=><article className="tactic-card" key={e.id}>
            <div className="card-badge">{e.level}</div><h3>{e.title}</h3><p>{e.category}</p><small>{e.notes||"Sem observações"}</small>
            <div className="card-actions"><button onClick={()=>loadEntry(e)}><FolderOpen size={17}/>Abrir</button></div>
          </article>)}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${drawMode?"draw-mode":""}`}>
      <header className="topbar">
        <div className="brand"><div className="brandmark">JB</div><div><h1>JB Tactics <span>PRO</span></h1><p>Editor tático</p></div></div>
        <div className="headline"><input value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})}/></div>
        <div className="top-actions">
          <button className="icon-btn secondary" onClick={undo}><Undo2 size={18}/></button>
          <button className="icon-btn secondary" onClick={redo}><Redo2 size={18}/></button>
          <button className="secondary" onClick={saveCurrent}><Save size={18}/>Salvar</button>
          <button className="secondary" onClick={saveLibrary}><Library size={18}/>Biblioteca</button>
          <button className="secondary" onClick={()=>{if(scenes.length===0)addScene();setPresenting(true)}}><Play size={18}/>Apresentar</button>
          <button onClick={exportPNG}><ImageDown size={18}/>PNG</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="toolbar panel">
          <button className="secondary" onClick={()=>setView("home")}><Home size={18}/>Início</button>

          <div className="section-title">Elementos</div>
          <button onClick={()=>addPlayer("A")}><UserPlus size={19}/>Jogador A</button>
          <button className="blue" onClick={()=>addPlayer("B")}><UserPlus size={19}/>Jogador B</button>
          <button className="amber" onClick={addCoach}><GraduationCap size={19}/>Professor</button>
          <button onClick={addBall}><CircleDot size={19}/>Bola</button>
          <button onClick={addCone}><Triangle size={19}/>Cone</button>
          <button onClick={addNote}><Type size={19}/>Texto</button>

          <div className="section-title small">Trajetórias</div>
          <button className={drawMode==="movement"?"active-tool":""} onClick={()=>setDrawMode(drawMode==="movement"?null:"movement")}>
            <MoveUpRight size={19}/>Movimento
          </button>
          <button className={drawMode==="attack"?"active-tool red-tool":""} onClick={()=>setDrawMode(drawMode==="attack"?null:"attack")}>
            <MoveUpRight size={19}/>Ataque
          </button>
          <button className={drawMode==="defense"?"active-tool blue-tool":""} onClick={()=>setDrawMode(drawMode==="defense"?null:"defense")}>
            <MoveUpRight size={19}/>Defesa
          </button>
          <button className={drawMode==="ballpath"?"active-tool yellow-tool":""} onClick={()=>setDrawMode(drawMode==="ballpath"?null:"ballpath")}>
            <Waves size={19}/>Trajetória bola
          </button>

          <div className="section-title small">Quadra</div>
          <button className="secondary" onClick={()=>setMeta({...meta,courtMode:meta.courtMode==="full"?"half":"full"})}>
            {meta.courtMode==="full"?<RectangleHorizontal size={18}/>:<Columns2 size={18}/>}
            {meta.courtMode==="full"?"Meia quadra":"Quadra inteira"}
          </button>
          <button className="secondary" onClick={()=>setShowZones(v=>!v)}>{showZones?<EyeOff size={18}/>:<Eye size={18}/>}Zonas</button>
          <button className="secondary" onClick={()=>window.print()}><Printer size={18}/>A4</button>

          <div className="section-title small">Edição</div>
          <button className="secondary" disabled={!selected} onClick={dup}><Copy size={18}/>Duplicar</button>
          <button className="danger" disabled={!selected} onClick={del}><Trash2 size={18}/>Excluir</button>
          <button className="ghost" onClick={()=>{if(confirm("Limpar quadra?"))commit([],"Quadra limpa")}}><RotateCcw size={18}/>Limpar</button>
        </aside>

        <main className="canvas-area">
          <div className="board-head">
            <div><span className="eyebrow">QUADRA TÁTICA</span><h2>{meta.title}</h2></div>
            <div className="hint">{drawMode?<><MoveUpRight size={16}/>Arraste na quadra</>:<><MousePointer2 size={16}/>Selecione para editar</>}</div>
          </div>

          <div className="stage-shell" ref={stageBoxRef} style={{height:DESIGN_H*scale}}>
            <div className="board-wrap" style={{width:DESIGN_W*scale,height:DESIGN_H*scale}}>
              <Stage ref={stageRef} width={DESIGN_W*scale} height={DESIGN_H*scale} scaleX={scale} scaleY={scale}
                onMouseDown={onDown} onTouchStart={onDown} onMouseMove={onMove} onTouchMove={onMove} onMouseUp={onUp} onTouchEnd={onUp}>
                <Layer>
                  <Rect x={0} y={0} width={DESIGN_W} height={DESIGN_H} fill="#20242b"/>

                  <Rect x={court.x} y={court.y} width={court.width} height={court.height} fill="#e3cf97" stroke="#fff" strokeWidth={4}/>

                  {showZones&&<>
                    <Rect x={court.x} y={court.y} width={court.width} height={court.height*.1875} fill="#ef4444" opacity={.08}/>
                    <Rect x={court.x} y={court.y+court.height*.1875} width={court.width} height={court.height*.1875} fill="#facc15" opacity={.07}/>
                    <Rect x={court.x} y={court.y+court.height*.375} width={court.width} height={court.height*.125} fill="#22c55e" opacity={.07}/>
                    {meta.courtMode==="full"&&<>
                      <Rect x={court.x} y={court.y+court.height*.5} width={court.width} height={court.height*.125} fill="#22c55e" opacity={.07}/>
                      <Rect x={court.x} y={court.y+court.height*.625} width={court.width} height={court.height*.1875} fill="#facc15" opacity={.07}/>
                      <Rect x={court.x} y={court.y+court.height*.8125} width={court.width} height={court.height*.1875} fill="#ef4444" opacity={.08}/>
                    </>}
                  </>}

                  {meta.courtMode==="full"&&
                    <Line points={[court.x,court.y+court.height/2,court.x+court.width,court.y+court.height/2]} stroke="#4e5155" strokeWidth={5}/>
                  }

                  <Line points={[court.x+court.width/2,court.y,court.x+court.width/2,court.y+court.height]} stroke="#fff" strokeWidth={2} opacity={.65}/>

                  {[.1875,.375].map(v=><Line key={v} points={[court.x,court.y+court.height*v,court.x+court.width,court.y+court.height*v]} stroke="#fff" strokeWidth={1} opacity={.2} dash={[7,7]}/>)}
                  {meta.courtMode==="full"&&[.625,.8125].map(v=><Line key={v} points={[court.x,court.y+court.height*v,court.x+court.width,court.y+court.height*v]} stroke="#fff" strokeWidth={1} opacity={.2} dash={[7,7]}/>)}

                  {items.map(renderItem)}
                  {draft&&<Arrow points={draft.points} stroke={draft.color} fill={draft.color} strokeWidth={5} pointerLength={16} pointerWidth={16} tension={draft.type==="curve"?.45:0} dash={draft.dashed?[14,10]:[]}/>}
                  {renderLegend()}
                </Layer>
              </Stage>
            </div>
          </div>

          <div className="statusbar">
            <span>{status}</span>
            <span>{meta.courtMode==="full"?"Quadra inteira":"Meia quadra"}</span>
          </div>

          <section className="sequence-panel">
            <div className="sequence-head">
              <div><span className="eyebrow">SEQUÊNCIA DA JOGADA</span><h3>Passos da tática</h3></div>
              <div className="sequence-actions">
                <button className="secondary" onClick={saveScene}><Save size={16}/>Atualizar passo</button>
                <button className="secondary" onClick={duplicateScene}><Copy size={16}/>Duplicar cena</button>
                <button onClick={addScene}><Plus size={16}/>Novo passo</button>
              </div>
            </div>
            <div className="scene-strip">
              {scenes.length===0 ? (
                <button className="scene-empty" onClick={addScene}><Film size={24}/><span>Criar o Passo 1</span></button>
              ) : scenes.map((scene,idx)=>(
                <div className={`scene-thumb ${idx===sceneIndex?"selected":""}`} key={scene.id} onClick={()=>openScene(idx)}>
                  <div className="scene-number">{idx+1}</div>
                  <div className="scene-court"><span></span><i></i></div>
                  <strong>Passo {idx+1}</strong>
                  <button className="scene-delete" onClick={e=>{e.stopPropagation();deleteScene(idx)}} title="Excluir"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          </section>

          <div className="print-notes">
            <div className="print-brandline">JB Tactics • {meta.category} • {meta.level}</div>
            <h3>{meta.title}</h3>
            <p>{meta.notes||"Sem observações."}</p>
          </div>
        </main>

        <aside className="properties panel">
          <div className="section-title">Tática</div>
          <div className="property-form">
            <label>Categoria<select value={meta.category} onChange={e=>setMeta({...meta,category:e.target.value})}>
              <option>Saque</option><option>Recepção</option><option>Construção</option><option>Terceira bola</option><option>Defesa</option><option>Transição</option>
            </select></label>
            <label>Nível<select value={meta.level} onChange={e=>setMeta({...meta,level:e.target.value})}>
              <option>Iniciante</option><option>Intermediário</option><option>Avançado</option>
            </select></label>
            <label>Observações<textarea rows="5" value={meta.notes} onChange={e=>setMeta({...meta,notes:e.target.value})}/></label>
          </div>

          <div className="section-title element-title">Elemento</div>
          {!selected?<div className="empty-state"><MousePointer2 size={28}/><strong>Selecione um elemento</strong><span>As opções aparecem aqui.</span></div>:
          <div className="property-form">
            {(selected.type==="player"||selected.type==="coach")&&<>
              <label>Nome<input value={selected.label||""} onChange={e=>update(selected.id,{label:e.target.value})}/></label>
              <label>Cor<input type="color" value={selected.color||"#fff"} onChange={e=>update(selected.id,{color:e.target.value})}/></label>
              <label>Tamanho<input type="range" min="18" max="38" value={selected.size||24} onChange={e=>update(selected.id,{size:Number(e.target.value)})}/></label>
            </>}
            {selected.type==="note"&&<>
              <label>Texto<textarea rows="4" value={selected.text||""} onChange={e=>update(selected.id,{text:e.target.value})}/></label>
              <label>Cor<input type="color" value={selected.color||"#fff"} onChange={e=>update(selected.id,{color:e.target.value})}/></label>
            </>}
            {(selected.type==="arrow"||selected.type==="curve")&&<>
              <label>Tipo visual
                <select value={selected.label||"Movimento"} onChange={e=>{
                  const map = {
                    "Movimento":{color:C.movement,dashed:true},
                    "Ataque":{color:C.attack,dashed:false},
                    "Defesa":{color:C.defense,dashed:true},
                    "Trajetória da bola":{color:C.ballPath,dashed:false}
                  };
                  update(selected.id,{label:e.target.value,...map[e.target.value]});
                }}>
                  <option>Movimento</option><option>Ataque</option><option>Defesa</option><option>Trajetória da bola</option>
                </select>
              </label>
              <label>Cor<input type="color" value={selected.color||"#fff"} onChange={e=>update(selected.id,{color:e.target.value})}/></label>
              <label>Espessura<input type="range" min="3" max="12" value={selected.width||5} onChange={e=>update(selected.id,{width:Number(e.target.value)})}/></label>
              <label className="checkline"><input type="checkbox" checked={!!selected.dashed} onChange={e=>update(selected.id,{dashed:e.target.checked})}/> Tracejado</label>
              <div className="tip">Arraste os pontos verdes para alterar início e fim.</div>
            </>}
            <button className="secondary" onClick={dup}><Copy size={18}/>Duplicar</button>
            <button className="danger" onClick={del}><Trash2 size={18}/>Excluir</button>
          </div>}
        </aside>
      </div>
    </div>
  );
}
