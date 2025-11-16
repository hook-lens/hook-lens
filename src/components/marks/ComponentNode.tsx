import { Position, NodeToolbar, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";
import { FaFileCode } from "react-icons/fa6";
import { useCallback, useState } from "react";

import { ComponentNodeProps } from "../../types/NodeData";
import { Constants } from "../../data/Constants";

import "./MarkStyle.css";

export default function ComponentNode({
  data,
  type,
}: NodeProps<ComponentNodeProps>) {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const component = data.component;

  const isExpanded = type === "expanded";
  const hasState = component.states.length > 0;
  const hasProps = component.props.length > 0;
  const isConcerned = data.isConcerned;
  const isHovered = data.isHovered;
  const isUnused =
    component.children.length === 0 && data.indexData.level === 0;

  const baseWidth = Constants.baseWidth;

  const onMouseEnter = useCallback(() => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    setIsToolbarOpen(true);
  }, [timer]);

  const onMouseLeave = useCallback(() => {
    const timer = setTimeout(() => {
      setIsToolbarOpen(false);
    }, 1000);
    setTimer(timer);
  }, [timer]);

  return (
    <div
      className={
        "hover:drop-shadow-lg hover:scale-105 transition-all duration-100 rounded-[11px] opacity-85 " +
        (isHovered ? "opacity-100 drop-shadow-lg scale-105 " : "")
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={
          "font-[Inter] font-semibold absolute -top-6 pl-0.5 text-left text-[12px] " +
          (isUnused ? "text-gray-400 " : "text-gray-950 ")
        }
      >
        {component.name}
      </div>
      <div
        className="node-content rounded-[10px] bg-[#ffffff] transition-all duration-100 outline-2 outline-[#f0f0f0] "
        style={{
          ...data.size,
        }}
      />
      {!isExpanded && isConcerned && (
        <svg
          className="absolute -top-[2px] -left-[2px] z-50"
          width={data.size.width + 4}
          height={data.size.height + 4}
        >
          <rect
            x="1px"
            y="1px"
            rx="11px"
            ry="11px"
            width={data.size.width + 2}
            height={data.size.height + 2}
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2"
            className="animate-path"
          />
        </svg>
      )}
      {!isExpanded && hasProps && (
        <div
          className="bg-[#eb9049] rounded-l-[10px] absolute top-0 left-0"
          style={{
            width: baseWidth,
            height: data.size.height,
          }}
        />
      )}
      {!isExpanded && hasState && (
        <div
          className="bg-[#b7de90] rounded-r-[10px] absolute top-0 right-0"
          style={{
            width: baseWidth,
            height: data.size.height,
          }}
        />
      )}
      <Handle type="source" position={Position.Right} className="bg-[#555]" />
      <Handle type="target" position={Position.Left} className="bg-[#555]" />

      <NodeToolbar
        isVisible={isToolbarOpen}
        offset={5}
        position={Position.Right}
      >
        <button
          className="flex justify-center bg-gray-100 text-gray-700 size-[30px] rounded-sm p-1 transition-all duration-100 shadow active:inset-shadow hover:bg-gray-500 hover:text-gray-100"
          onClick={(e) => {
            data.openCodeView(component);
            e.stopPropagation();
          }}
        >
          <FaFileCode className="size-[20px]" />
        </button>
      </NodeToolbar>
    </div>
  );
}
