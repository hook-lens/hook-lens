import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import nodeStyles from "../../data/nodeStyles.json";

type PropMarkData = Node<{ label: string }, "prop">;

export default function PropMark({ data }: NodeProps<PropMarkData>) {
  const width = 20;
  const height = 20;
  return (
    <div className="prop">
      <div
        className="label-content"
        style={{
          position: "absolute",
          top: -13,
          textAlign: "left",
          fontSize: 11,
        }}
      >
        {data.label}
      </div>
      <div
        className="node-content"
        style={{
          width: width,
          height: height,
          borderRadius: 2,
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
