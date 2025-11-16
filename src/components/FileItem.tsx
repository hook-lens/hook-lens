import { useState } from "react";
import { Node } from "@xyflow/react";
import {
  FaReact,
  FaFolderClosed,
  FaFolderOpen,
  FaRegFileCode,
} from "react-icons/fa6";

import { File } from "../types/File";
import { ComponentNodeProps } from "../types/NodeData";

export default function FileItem({
  directory,
  onNodeClicked,
  onItemHovered,
}: {
  directory: File;
  onNodeClicked: (_: React.MouseEvent, node: Node) => void;
  onItemHovered?: (components: ComponentNodeProps[]) => void;
}) {
  const [isOpen, setOpen] = useState(true);

  let isConcerned = false;
  const checkConcerned = (file: File) => {
    if (file.componentNodes) {
      isConcerned = file.componentNodes.some((node) => node.data.isConcerned);
    } else {
      file.children.forEach((child) => {
        checkConcerned(child);
      });
    }
  };
  checkConcerned(directory);

  const getComponents = (file: File) => {
    const components: ComponentNodeProps[] = [];
    if (file.componentNodes) {
      components.push(...file.componentNodes);
    } else {
      file.children.forEach((child) => {
        components.push(...getComponents(child));
      });
    }
    return components;
  };

  const onMouseEnter = () => {
    onItemHovered?.(getComponents(directory));
  };

  const onMouseLeave = () => {
    onItemHovered?.([]);
  };

  return (
    <div className="flex flex-col text-xs text-gray-950 text-nowrap select-none">
      <button
        className="flex flex-row gap-1 w-fit items-center transition-all duration-50 hover:bg-gray-300 hover:font-semibold rounded-md px-1"
        onClick={() => setOpen(!isOpen)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {directory.isDirectory ? (
          isOpen ? (
            <FaFolderOpen className="text-gray-500" />
          ) : (
            <FaFolderClosed className="text-gray-500" />
          )
        ) : (
          <FaRegFileCode className="text-gray-500" />
        )}
        <span className={isConcerned && !isOpen ? "text-[#b91c1c] " : " "}>
          {directory.name}
        </span>
      </button>

      <div
        className={
          "flex flex-col ml-2 " +
          (directory.isDirectory ? "pl-2 border-l-1 border-l-gray-300 " : " ") +
          (isOpen ? "block " : "hidden ")
        }
      >
        {directory.children.map((child) => (
          <FileItem
            key={`${directory.uid}_${child.uid}`}
            directory={child}
            onNodeClicked={onNodeClicked}
            onItemHovered={onItemHovered}
          />
        ))}
        {directory.componentNodes?.map((componentNode) => (
          <button
            key={`file_item_${componentNode.id}`}
            className={
              "flex flex-row gap-1 items-center ml-1.5 px-1 w-fit rounded-md transition-all duration-50 hover:bg-gray-300 hover:font-semibold bg-[#ffffff] border-2 border-[#f0f0f0] " +
              (componentNode.data.isConcerned ? "text-[#b91c1c] " : " ")
            }
            onClick={(e) => onNodeClicked(e, componentNode)}
            onMouseEnter={() => {
              onItemHovered?.([componentNode]);
            }}
            onMouseLeave={onMouseLeave}
          >
            <FaReact />
            <span>{componentNode.data.component.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
