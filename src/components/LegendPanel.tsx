import { FaAngleUp } from "react-icons/fa6";
import { useState } from "react";

import NodeLegendItem, { NodeStyle } from "./NodeLegendItem";
import EdgeLegendItem, { EdgeStyle } from "./EdgeLegendItem";

export interface LegendPanelProps {
  nodeStyles: NodeStyle[];
  edgeStyles: EdgeStyle[];
}

export default function LegendPanel({
  nodeStyles,
  edgeStyles,
}: LegendPanelProps) {
  const [isExpanded, setExpanded] = useState(true);

  return (
    <div
      className={
        "shrink-0 flex flex-col gap-1 w-[200px] rounded-xl shadow-lg px-1 py-1 transition-all duration-300 overflow-hidden hover:bg-gray-300 " +
        (isExpanded ? " bg-gray-300 max-h-[500px]" : "bg-gray-100 max-h-[32px]")
      }
    >
      <button
        className="flex flex-row gap-2 py-0.5 px-3 text-sm w-full rounded-sm cursor-pointer items-center font-[Inter] font-extrabold "
        onClick={() => setExpanded(!isExpanded)}
      >
        <div className="w-full">Legend</div>
        <div className="absolute self-center p-1 rounded-full size-fit transition-all duration-100 bg-gray-100 text-gray-500 z-50">
          <FaAngleUp
            className={
              "transition-all duration-100 " +
              (isExpanded ? "rotate-0 " : "rotate-180 ")
            }
          />
        </div>
      </button>
      <div className="flex flex-col gap-1 py-1 px-2 bg-[#fafafa] rounded-md">
        <div className="text-sm text-gray-950 font-[Inter] font-extrabold">
          Node
        </div>
        {Object.values(nodeStyles).map((legend) => (
          <NodeLegendItem key={legend.label} {...legend} />
        ))}
      </div>

      <div className="flex flex-col gap-1 py-1 px-2 bg-[#fafafa] rounded-md">
        <div className="text-sm text-gray-950 font-[Inter] font-extrabold">
          Edge
        </div>
        {Object.values(edgeStyles).map((legend) => (
          <EdgeLegendItem key={legend.label} {...legend} />
        ))}
      </div>
    </div>
  );
}
