export interface NodeStyle {
  label: string;
  color: string;
}

function getNodeBgColor(type: string) {
  switch (type) {
    case "component":
      return "bg-[#ffffff] ";
    case "prop":
      return "bg-[#eb9049] ";
    case "state":
      return "bg-[#b7de90] ";
    case "effect":
      return "bg-[#85b8e2] ";
  }

  return "bg-black ";
}

export default function NodeLegendItem(props: NodeStyle) {
  const borderClassName =
    props.label === "Component" ? " border-2 border-[#f0f0f0] " : " ";
  return (
    <div className="flex flex-row gap-2 items-center">
      <div
        className={`${getNodeBgColor(
          props.label.toLowerCase()
        )} ${borderClassName} rounded-md w-7.5 h-3.5`}
      />
      <div className="font-[Inter] text-xs text-gray-950 font-bold">
        {props.label}
      </div>
    </div>
  );
}
