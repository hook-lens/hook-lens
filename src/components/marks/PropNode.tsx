import { Position, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import { PropNodeProps } from "../../types/NodeData";

import "./MarkStyle.css";

export default function PropNode({ data }: NodeProps<PropNodeProps>) {
  const prop = data.prop;

  const references = prop.references;
  const type = prop.originState.startsWith("setter")
    ? "Set"
    : prop.originState.startsWith("state")
    ? "Var"
    : "";
  const isNoAccess = prop.accessingPositions.length === 0;

  return (
    <div className="prop transition-all duration-100 hover:drop-shadow-lg hover:scale-110">
      <div
        className={
          "absolute font-[JetBrains_Mono] text-[10px] -top-4 text-left " +
          (isNoAccess
            ? "text-[#b91c1c] "
            : references.length === 0
            ? "text-gray-400 "
            : "text-gray-950 ")
        }
      >
        {prop.name}
      </div>
      {!prop.isValuableAccess && (
        <svg className="absolute -top-[2px] -left-[2px]" width={28} height={28}>
          <rect
            x="1px"
            y="1px"
            rx="6px"
            ry="6px"
            width={26}
            height={26}
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2"
            className="animate-path"
          />
        </svg>
      )}
      <div className="node-content text-center rounded-[5px] size-[24px] dotted-line font-[JetBrains_Mono] text-[8px] font-extrabold italic content-center text-[#fafafa] bg-[#eb9049] outline-2 outline-[#f0f0f0] ">
        {type}
      </div>

      <Handle className="bg-[#555]" type="source" position={Position.Right} />
      <Handle className="bg-[#555]" type="target" position={Position.Left} />
      <Handle
        className="bg-[#555]"
        type="target"
        id="concerned"
        position={Position.Right}
      />
    </div>
  );
}
