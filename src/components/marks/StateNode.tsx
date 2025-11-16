import { Position, Handle, type NodeProps } from "@xyflow/react";

import { StateNodeProps } from "../../types/NodeData";

import "./MarkStyle.css";

export default function StateNode({ data }: NodeProps<StateNodeProps>) {
  const state = data.state;
  const isNoAccess =
    state.accessingPositions.length === 0 &&
    state.accessingSetterPositions.length === 0;
  const isNoValuableAccess =
    !state.isValuableAccess &&
    !state.isValuableSetterAccess &&
    state.dereferences.length < 2;

  return (
    <div className="state transition-all duration-100 hover:drop-shadow-lg font-[JetBrains_Mono] hover:scale-110">
      <div
        className={
          "absolute text-[10px] -top-4 right-0 text-right " +
          (isNoAccess ? "text-[#b91c1c] " : "text-gray-950 ")
        }
      >
        {state.name}
      </div>
      {isNoValuableAccess && (
        <svg className="absolute -top-[2px] -left-[2px]" width={28} height={28}>
          <rect
            x="1px"
            y="1px"
            rx="7px"
            ry="7px"
            width={26}
            height={26}
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2"
            className="animate-path"
          />
        </svg>
      )}
      <div className="flex flex-col gap-[2px]">
        <div className="node-content rounded-[5px] w-[24px] h-[11px] bg-[#b7de90] outline-2 outline-[#f0f0f0] " />
        <div className="node-content rounded-[5px] w-[24px] h-[11px] bg-[#b7de90] outline-2 outline-[#f0f0f0] " />
      </div>

      <div className="absolute text-[7px] font-extrabold italic text-[#fafafa] content-center text-center w-[23px] h-[11px] top-[1px]">
        Var
      </div>
      <div className="absolute text-[7px] font-extrabold italic text-[#fafafa] content-center text-center w-[23px] h-[11px] top-[14px]">
        Set
      </div>
      <Handle
        className="bg-[#555]"
        type="source"
        position={Position.Right}
        style={{ top: 5.5 }}
      />
      <Handle
        className="bg-[#555]"
        type="source"
        position={Position.Right}
        style={{ top: 17.5 }}
        id="setter"
      />
      <Handle
        className="bg-[#555]"
        type="source"
        position={Position.Left}
        style={{ top: 5.5 }}
        id="valueInner"
      />
      <Handle
        className="bg-[#555]"
        type="source"
        position={Position.Left}
        style={{ top: 17.5 }}
        id="setterInner"
      />
      <Handle
        className="bg-[#555]"
        type="target"
        position={Position.Left}
        style={{ top: 5.5 }}
      />
      <Handle
        className="bg-[#555]"
        type="target"
        id="setter"
        position={Position.Left}
        style={{ top: 17.5 }}
      />
    </div>
  );
}
