import LineArrow from "./assets/LineArrow";
import DashedArrow from "./assets/DashedArrow";

export interface EdgeStyle {
  label: string;
  color: string;
  style: string;
}

export default function EdgeLegendItem(props: EdgeStyle) {
  return (
    <div className="flex flex-row gap-2 items-center">
      {props.style === "dashed" ? (
        <DashedArrow color={props.color} />
      ) : (
        <LineArrow color={props.color} />
      )}
      <div className="font-[Inter] text-xs text-gray-950 font-bold">{props.label}</div>
    </div>
  );
}
