export default function DashedArrow({ color }: { color: string }) {
  return (
    <svg
      width="30px"
      height="10px"
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
