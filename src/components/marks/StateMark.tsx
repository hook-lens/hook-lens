import { Position, Handle, type Node, type NodeProps } from "@xyflow/react";

import nodeStyles from "../../data/nodeStyles.json";
import "./MarkStyle.css";

type StateMarkData = Node<{ label: string }, "state">;

export default function StateMark({ data }: NodeProps<StateMarkData>) {
  const width = 22;
  const height = 22;

  return (
    <div className="state">
      <div
        className="label-content state-label"
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
          background: nodeStyles.state.color,
        }}
      />

      <div
        className="state-handle-label"
        style={{
          width: 35,
          fontSize: 9,
          position: "absolute",
          textAlign: "center",
          borderRadius: 5,
          top: -2,
          left: width + 3,
        }}
      >
        value
      </div>
      <div
        className="state-handle-label"
        style={{
          width: 35,
          fontSize: 9,
          position: "absolute",
          textAlign: "center",
          borderRadius: 5,
          top: height - 10,
          left: width + 3,
        }}
      >
        setter
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "black", top: 4, right: -42 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "black", top: height - 4, right: -42 }}
        id="setter"
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
      />
    </div>
  );
}
