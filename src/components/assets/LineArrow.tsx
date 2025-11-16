export default function LineArrow({ color }: { color: string }) {
    return (
      <svg
        width="30px"
        height="10px"
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
  