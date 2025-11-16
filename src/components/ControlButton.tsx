interface ControlButtonProps {
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}

export default function ControlButton(props: ControlButtonProps) {
  return (
    <button
      className={
        "rounded-md p-1 min-w-28 hover:bg-gray-500 hover:text-gray-100 cursor-pointer transition-all duration-100 shadow active:inset-shadow font-[Inter] font-bold text-sm " +
        (props.isActive
          ? "bg-gray-500 text-gray-100 "
          : "bg-gray-100 text-gray-700 ") +
        (props.className && `${props.className} `)
      }
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
