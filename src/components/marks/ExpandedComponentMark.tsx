import { Position, type Node, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { ComponentNode } from "../../module/HookExtractor";

import "./MarkStyle.css";

type ExpandedComponentMarkData = Node<
  {
    label: string;
    component: ComponentNode;
    setNode: React.Dispatch<React.SetStateAction<Node[]>>;
    size: { width: number; height: number };
    x: number;
    y: number;
  },
  "expanded"
>;

export default function ExpandedComponentMark({
  data,
}: NodeProps<ExpandedComponentMarkData>) {
  return (
    <div className="expanded">
      <div className="componentLabel">{data.label}</div>
      <div
        className="node-content componentNode"
        style={{
          width: data.size.width,
          height: data.size.height,
        }}
      ></div>

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
