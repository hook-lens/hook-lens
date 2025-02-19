import {
  Position,
  NodeToolbar,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { FaFileCode } from "react-icons/fa6";
import { useCallback, useState } from "react";
import { ComponentNode } from "../../module/HookExtractor";

import nodeStyles from "../../data/nodeStyles.json";

import "./MarkStyle.css";

type ComponentMarkData = Node<
  {
    label: string;
    hasState: boolean;
    hasProps: boolean;
    baseWidth: number;
    component: ComponentNode;
    openCodeView: (component: ComponentNode) => void;
  },
  "component"
>;

export default function ComponentMark({ data }: NodeProps<ComponentMarkData>) {
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

  const baseWidth = data.baseWidth;
  const width =
    data.hasState && data.hasProps
      ? baseWidth * 2
      : data.hasState || data.hasProps
      ? baseWidth + 10
      : baseWidth;

  return (
    <div
      className="component"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="componentLabel">{data.label}</div>
      <div
        className="node-content"
        style={{
          borderRadius: 10,
          background: nodeStyles.component.color,
          width: width,
          height: baseWidth,
        }}
      />
      {data.hasProps && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: baseWidth,
            height: baseWidth,
            borderRadius: "10px 0 0 10px",
            background: nodeStyles.prop.color,
          }}
        />
      )}
      {data.hasState && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: baseWidth,
            height: baseWidth,
            borderRadius: "0 10px 10px 0",
            background: nodeStyles.state.color,
          }}
        />
      )}
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
        offset={5}
        position={Position.Right}
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
