import { Stage, Layer, Rect, Line, Circle, Text } from "react-konva";

export default function Court(){
  return (
    <Stage width={900} height={600}>
      <Layer>
        <Rect x={150} y={50} width={600} height={500}
          fill="#e8d7a8" stroke="white" strokeWidth={4}/>

        <Line points={[150,300,750,300]} stroke="#555" strokeWidth={3}/>
        <Line points={[450,50,450,550]} stroke="white" strokeWidth={2}/>

        <Circle x={450} y={250} radius={15} fill="#16d600" draggable/>
        <Text x={410} y={570} text="Professor" fontSize={18} fill="white"/>

        <Circle x={450} y={350} radius={15} fill="#222" draggable/>
      </Layer>
    </Stage>
  )
}