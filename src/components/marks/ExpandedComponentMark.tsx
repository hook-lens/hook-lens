import {
  NodeToolbar,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { ComponentNode } from "../../module/HookExtractor";
import { useCallback, useState } from "react";
import { FaFileCode } from "react-icons/fa6";

import nodeStyles from "../../data/nodeStyles.json";

import "./MarkStyle.css";

type ExpandedComponentMarkData = Node<
  {
    label: string;
    component: ComponentNode;
    setNode: React.Dispatch<React.SetStateAction<Node[]>>;
    size: { width: number; height: number };
    x: number;
    y: number;
    openCodeView: (component: ComponentNode) => void;
  },
  "expanded"
>;

export default function ExpandedComponentMark({
  data,
}: NodeProps<ExpandedComponentMarkData>) {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const onMouseEnter = useCallback(() => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    setIsToolbarOpen(true);
  }, [timer]);

  const onMouseLeave = () => {
    const timer = setTimeout(() => {
      setIsToolbarOpen(false);
    }, 1000);
    setTimer(timer);
  };

  return (
    <div
      className="expanded"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="componentLabel">{data.label}</div>
      <div
        className="node-content"
        style={{
          borderRadius: 2,
          background: nodeStyles.component.color,
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

      <NodeToolbar
        isVisible={isToolbarOpen}
        offset={0}
        position={Position.Top}
        align="end"
      >
        <button
          className="toolbarButton"
          onClick={(e) => {
            data.openCodeView(data.component);
            e.stopPropagation();
          }}
        >
          <FaFileCode
            style={{
              width: 20,
              height: 20,
            }}
          />
        </button>
      </NodeToolbar>
    </div>
  );
}
