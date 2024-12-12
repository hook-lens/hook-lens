import { ComponentProps, EffectListProps } from "../types/data";
import {
  Edge,
  ReactFlow,
  Node,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import LabelNode from "./LabelNode";

const nodeTypes = { label: LabelNode };

export default function DetailedComponent({
  component,
  effects,
}: {
  component: ComponentProps | undefined;
  effects: EffectListProps;
}) {
  // const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  // const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const defaultViewport = { x: 0, y: 0, zoom: 0.3 };

  if (!component) return <div>Component not found</div>;
  const effectNode: Node[] = component.effects.map((effect, i) => ({
    id: effect,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    type: "default",
    style: { background: "#32ADE6", border: "none" },
    data: { label: effect },
    position: { x: 150, y: 50 },
  }));

  const propNode: Node[] = [];
  component.props.forEach((prop, i) => {
    propNode.push({
      id: prop,
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: { background: "#A2845E", border: "none", width: 40, height: 40 },
      data: { value: prop },
      position: { x: 10, y: 50 + i * 70 },
    });
    propNode.push({
      id: `${prop}-label`,
      type: "label",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: { background: "rgba(0,0,0,0)", border: "none" },
      data: { label: prop },
      position: { x: 10, y: 30 + i * 70 },
    });
  });

  const stateNode: Node[] = [];
  component.states.forEach((state, i) => {
    stateNode.push({
      id: state,
      type: "default",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: { background: "#34C759", border: "none", width: 40, height: 40 },
      data: { value: state },
      position: { x: 400, y: 50 + i * 70 },
    });
    stateNode.push({
      id: `${state}-label`,
      type: "label",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: { background: "rgba(0,0,0,0)", border: "none" },
      data: { label: state },
      position: { x: 400, y: 30 + i * 70 },
    });
  });

  const edges: Edge[] = [];
  component.effects.forEach((effectId) => {
    const effect = effects.items.find((item) => item.id === effectId);
    if (!effect) return;

    effect.dependencyIds.forEach((depId) => {
      edges.push({
        id: `${effectId}-${depId}`,
        source: depId,
        target: effectId,
        style: depId.startsWith("state")
          ? { stroke: "#FF3B30", strokeWidth: 2 }
          : { stroke: "black", strokeWidth: 2 },
        animated: depId.startsWith("state") ? true : false,
      });
    });

    console.log("effect", effect);

    effect.handlingTargetIds.forEach((targetId) => {
      edges.push({
        id: `${effectId}-${targetId}`,
        source: effectId,
        target: targetId,
        style: targetId.startsWith("prop")
          ? { stroke: "#FF3B30", strokeWidth: 2 }
          : { stroke: "black", strokeWidth: 2 },
        animated: targetId.startsWith("prop") ? true : false,
      });
    });
  });

  console.log("effectNode", effectNode, propNode, stateNode, edges);

  return (
    <ReactFlow
      nodes={effectNode.concat(propNode).concat(stateNode)}
      edges={edges}
      // onNodesChange={onNodesChange}
      // onEdgesChange={onEdgesChange}
      // onConnect={onConnect}
      nodeTypes={nodeTypes}
      snapToGrid={true}
      // fitView
      attributionPosition="bottom-left"
    ></ReactFlow>
  );
}
