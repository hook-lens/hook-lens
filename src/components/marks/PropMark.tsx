import { memo } from "react";
import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

type PropMark = Node<{ label: string }, "prop">;

export default function PropMark({ data }: NodeProps<PropMark>) {
  const width = 25;
  const height = 25;
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
          background: "#A2845E",
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
