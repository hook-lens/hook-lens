import { FaAngleRight } from "react-icons/fa6";

import ControlButton from "./ControlButton";
import { useState } from "react";

interface ControllerProps {
  onExpandedAllClicked: () => void;
  onCollapseAllClicked: () => void;
  onResetHighlightClicked: () => void;
  onSortByDegreeClicked: () => void;
  onSortByAscendingNameClicked: () => void;
  onSortByDescendingNameClicked: () => void;
  onSortByDefaultClicked: () => void;
  onSortByConcernedClicked: () => void;
  onFitViewClicked: () => void;
}

export default function Controller(props: ControllerProps) {
  const [isSortOpen, setSortOpen] = useState(false);
  const [sortType, setSortType] = useState("Default");

  const sortMethods = {
    Default: props.onSortByDefaultClicked,
    Concerned: props.onSortByConcernedClicked,
    Degree: props.onSortByDegreeClicked,
    "Ascend Name": props.onSortByAscendingNameClicked,
    "Descend Name": props.onSortByDescendingNameClicked,
  };

  return (
    <div className="absolute flex flex-row gap-1 z-50 rounded-lg transition-all left-[230px]">
      <ControlButton onClick={props.onExpandedAllClicked}>
        Expand all
      </ControlButton>
      <ControlButton onClick={props.onCollapseAllClicked}>
        Collapse all
      </ControlButton>
      <ControlButton onClick={props.onResetHighlightClicked}>
        Reset highlight
      </ControlButton>
      <ControlButton onClick={props.onFitViewClicked}>Fit View</ControlButton>
      <div
        className={
          "w-fit flex flex-row gap-0.5 p-1 rounded-md shadow transition-all duration-300 overflow-hidden hover:bg-gray-300 text-gray-800 " +
          (isSortOpen ? "max-w-[700px] bg-gray-300" : "max-w-18 bg-gray-100")
        }
      >
        <button
          className="font-[Inter] p-1 font-extrabold text-sm flex flex-row items-center cursor-pointer"
          onClick={() => setSortOpen(!isSortOpen)}
        >
          <div className="mx-1">Sort</div>
          <div
            className={
              "rounded-full p-1 size-fit bg-gray-100 text-gray-500 transition-all duration-100 "
            }
          >
            <FaAngleRight
              className={
                "transition-all duration-100 " +
                (isSortOpen ? " rotate-180 " : " ")
              }
            />
          </div>
        </button>
        {Object.entries(sortMethods).map(([key, value]) => (
          <ControlButton
            key={key}
            onClick={() => {
              setSortType(key);
              value();
            }}
            isActive={sortType === key}
          >
            {key}
          </ControlButton>
        ))}
      </div>
    </div>
  );
}
