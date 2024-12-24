import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import nodeStyles from "../../data/nodeStyles.json";

import "./MarkStyle.css";

type ComponentMarkData = Node<
  { label: string; hasState: boolean; hasProps: boolean; baseWidth: number },
  "component"
>;

export default function ComponentMark({ data }: NodeProps<ComponentMarkData>) {
  const baseWidth = data.baseWidth;
  const width =
    data.hasState && data.hasProps
      ? baseWidth * 2
      : data.hasState || data.hasProps
      ? baseWidth + 10
      : baseWidth;
  return (
    <div className="component">
      <div className="componentLabel">{data.label}</div>
      <div
        className="node-content"
        style={{
          borderRadius: 2,
          background: nodeStyles.component.color,
          width: width,
          height: baseWidth,
        }}
      />
      {data.hasProps && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: baseWidth,
            height: baseWidth,
            borderRadius: "2px 0 0 2px",
            background: nodeStyles.prop.color,
          }}
        />
      )}
      {data.hasState && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: baseWidth,
            height: baseWidth,
            borderRadius: "0 2px 2px 0",
            background: nodeStyles.state.color,
          }}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
      />
    </div>
  );
}
