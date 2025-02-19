interface NodeLegendProps {
  label: string;
  color: string;
}

export default function NodeLegendItem(props: NodeLegendProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
      }}
    >
      <div
        style={{
          borderRadius: 5,
          backgroundColor: props.color,
          boxShadow: (props.label === "Component" ? "0 0 0 1px #e0e0e0 inset" : "none"),
          width: 30,
          height: 15,
        }}
      />
      <div
        style={{
          fontSize: 14,
        }}
      >
        {props.label}
      </div>
    </div>
  );
}
