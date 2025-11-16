import { Position, type NodeProps } from "@xyflow/react";
import { Handle } from "@xyflow/react";

import { EffectNodeProps } from "../../types/NodeData";

import "./MarkStyle.css";

export default function EffectNode({ data }: NodeProps<EffectNodeProps>) {
  return (
    <div className="transition-all duration-100 opacity-95 hover:drop-shadow-lg hover:scale-110">
      <div className="node-content rounded-[5px] content-center w-20 h-5 bg-[#85b8e2] outline-2 outline-[#f0f0f0] ">
        <div className="text-center font-[JetBrains_Mono] text-[10px] text-white">
          {data.label}
        </div>
      </div>

      <Handle className="bg-[#555]" type="source" position={Position.Right} />
      <Handle className="bg-[#555]" type="target" position={Position.Left} />
    </div>
  );
}
