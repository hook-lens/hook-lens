import { useState } from "react";
import { FaAngleUp } from "react-icons/fa6";

import { Constants } from "../data/Constants";
import ControlButton from "./ControlButton";

const gapRange = Constants.gapRangeAmongComponents;

interface MarginControlPanelProps {
  horizontalSliderRef: React.RefObject<HTMLInputElement | null>;
  verticalSliderRef: React.RefObject<HTMLInputElement | null>;
  onHorizontalChange: () => void;
  onVerticalChange: () => void;
  onResetMargin: () => void;
}

export default function MarginControlPanel(props: MarginControlPanelProps) {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <div
      className={
        "flex flex-col gap-1 w-[200px] font-[Inter] rounded-xl shadow-lg px-1 py-1 transition-all duration-300 overflow-hidden hover:bg-gray-300 text-xs items-center " +
        (isExpanded ? " bg-gray-300 max-h-[500px]" : "bg-gray-100 max-h-[32px]")
      }
    >
      <button
        className="flex flex-row gap-2 py-0.5 px-3 w-full rounded-sm cursor-pointer items-center font-extrabold "
        onClick={() => setExpanded(!isExpanded)}
      >
        <div className="w-full text-sm">Modify margin</div>
        <div className="absolute self-center p-1 rounded-full size-fit transition-all duration-100 bg-gray-100 text-gray-500 z-50">
          <FaAngleUp
            className={
              "text-sm transition-all duration-100 " +
              (isExpanded ? "rotate-0 " : "rotate-180 ")
            }
          />
        </div>
      </button>
      <div className="flex flex-col w-full py-1 px-2 bg-[#fafafa] rounded-md items-center font-bold">
        <label>Horizontal margin</label>
        <input
          className="bg-gray-300 border-2 border-amber-300 "
          min={gapRange.x.min}
          max={gapRange.x.max}
          defaultValue={gapRange.x.default}
          type="range"
          onChange={props.onHorizontalChange}
          ref={props.horizontalSliderRef}
        />
      </div>
      <div className="flex flex-col w-full py-1 px-2 bg-[#fafafa] rounded-md items-center font-bold">
        <label>Vertical margin</label>
        <input
          className="bg-gray-300 border-2 border-amber-300 "
          min={gapRange.y.min}
          max={gapRange.y.max}
          defaultValue={gapRange.y.default}
          type="range"
          onChange={props.onVerticalChange}
          ref={props.verticalSliderRef}
        />
      </div>
      <ControlButton className="w-full " onClick={props.onResetMargin}>
        Reset margin
      </ControlButton>
    </div>
  );
}
