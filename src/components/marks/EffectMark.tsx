import { memo } from "react";
import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

type EffectMark = Node<{ label: string }, "effect">;

export default function EffectMark({ data }: NodeProps<EffectMark>) {
  const width = 80;
  const height = 25;
  return (
    <div className="effect">
      <div
        className="node-content"
        style={{
          alignContent: "center",
          width: width,
          height: height,
          borderRadius: 2,
          background: "#32ADE6",
        }}
      >
        <div
          className="label-content"
          style={{
            fontSize: 11,
          }}
        >
          {data.label}
        </div>
      </div>

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
