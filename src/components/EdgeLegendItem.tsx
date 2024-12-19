interface EdgeLegendProps {
  label: string;
  color: string;
  style: string;
}

export default function EdgeLegendItem(props: EdgeLegendProps) {
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
          borderRadius: 2,
          border: `2px ${props.style} ${props.color}`,
          width: 26,
          height: 3,
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
