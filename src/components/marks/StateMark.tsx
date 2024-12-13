import { memo } from "react";
import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

type StateMark = Node<{ label: string }, "state">;

export default function StateMark({ data }: NodeProps<StateMark>) {
  const width = 30;
  const height = 30;
  return (
    <div className="state">
      <div
        className="label-content"
        style={{
          position: "absolute",
          top: -15,
          right: 0,
          textAlign: "right",
          fontSize: 12,
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
          background: "#34C759",
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
