interface EdgeLegendProps {
  label: string;
  color: string;
  style: string;
}

function LineArrow({ color }: { color: string }) {
  return (
    <svg
      width="30"
      height="10"
      viewBox="0 0 30 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.5 0.669863L30 4.99999L22.5 9.33012L22.5 5.74999L-4.44119e-07 5.74999L-3.12985e-07 4.24999L22.5 4.24999L22.5 0.669863Z"
        fill={color}
      />
    </svg>
  );
}

function DashedArrow({ color }: { color: string }) {
  return (
    <svg
      width="30"
      height="10"
      viewBox="0 0 30 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.5 0.669861L30 4.99999L22.5 9.33011V0.669861ZM1.5 5.74999H0V4.24999H1.5L1.5 5.74999ZM7.5 5.74999H4.5V4.24999H7.5V5.74999ZM13.5 5.74999H10.5V4.24999L13.5 4.24999L13.5 5.74999ZM19.5 5.74999H16.5V4.24999L19.5 4.24999V5.74999Z"
        fill={color}
      />
    </svg>
  );
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
      {props.style === "dashed" ? (
        <DashedArrow color={props.color} />
      ) : (
        <LineArrow color={props.color} />
      )}
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
