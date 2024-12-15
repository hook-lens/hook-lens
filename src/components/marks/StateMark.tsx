import { Position, Handle, type Node, type NodeProps } from "@xyflow/react";

type StateMarkData = Node<{ label: string }, "state">;

export default function StateMark({ data }: NodeProps<StateMarkData>) {
  const width = 25;
  const height = 25;

  return (
    <div className="state">
      <div
        className="label-content"
        style={{
          position: "absolute",
          top: -13,
          right: 0,
          textAlign: "right",
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
          background: "#34C759",
        }}
      />

      <div
        style={{
          fontSize: 9,
          fontWeight: "bold",
          position: "absolute",
          top: -1,
          borderRadius: 2,
          padding: 1,
          left: width + 5,
          background: "rgb(220, 252, 231)",
        }}
      >
        value
      </div>
      <div
        style={{
          zIndex: 100,
          fontSize: 9,
          fontWeight: "bold",
          position: "absolute",
          top: height - 11,
          left: width + 5,
          borderRadius: 2,
          padding: 1,
          background: "rgb(254, 243, 199)",
        }}
      >
        setter
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "black", top: 5 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "black", top: height - 5 }}
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
