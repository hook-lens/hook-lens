import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import nodeStyles from "../../data/nodeStyles.json";
import "./MarkStyle.css";

type EffectMarkData = Node<{ label: string }, "effect">;

export default function EffectMark({ data }: NodeProps<EffectMarkData>) {
  const width = 80;
  const height = 20;
  return (
    <div className="effect">
      <div
        className="node-content"
        style={{
          alignContent: "center",
          width: width,
          height: height,
          borderRadius: 5,
          background: nodeStyles.effect.color,
        }}
      >
        <div
          className="label-content"
          style={{
            fontSize: 11,
            color: "white"
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
