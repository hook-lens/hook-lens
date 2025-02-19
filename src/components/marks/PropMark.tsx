import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import nodeStyles from "../../data/nodeStyles.json";
import "./MarkStyle.css";

type PropMarkData = Node<{ label: string }, "prop">;

export default function PropMark({ data }: NodeProps<PropMarkData>) {
  const width = 22;
  const height = 22;
  return (
    <div className="prop">
      <div
        className="label-content prop-label"
        style={{
          position: "absolute",
        }}
      >
        {data.label}
      </div>
      <div
        className="node-content"
        style={{
          width: width,
          height: height,
          borderRadius: 5,
          background: nodeStyles.prop.color,
        }}
      />

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
