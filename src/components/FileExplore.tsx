import { useState } from "react";
import { Node } from "@xyflow/react";
import { FaAngleUp } from "react-icons/fa6";

import { File } from "../types/File";
import { ComponentNodeProps } from "../types/NodeData";
import FileItem from "./FileItem";

export default function FileExplore({
  componentNodes,
  onNodeClicked,
  onItemHovered,
}: {
  componentNodes: ComponentNodeProps[];
  onNodeClicked: (_: React.MouseEvent, node: Node) => void;
  onItemHovered?: (components: ComponentNodeProps[]) => void;
}) {
  const [isExpanded, setExpanded] = useState(true);

  let index = 0;
  const directories: File[] = [];

  componentNodes
    .slice()
    .sort((a, b) => {
      return parseInt(a.id.split("_")[1]) - parseInt(b.id.split("_")[1]);
    })
    .forEach((componentNode) => {
      const path = componentNode.data.component.path.split("/");
      let currentDir = directories;
      path.forEach((dirName) => {
        const existingDir = currentDir.find((dir) => dir.name === dirName);
        const isDirectory = !/\.(js|jsx|ts|tsx)$/.test(dirName);
        if (existingDir) {
          currentDir = existingDir.children;
          if (!isDirectory) {
            existingDir.componentNodes = existingDir.componentNodes ?? [];
            existingDir.componentNodes.push(componentNode);
          }
        } else {
          const newDir: File = {
            name: dirName,
            isDirectory,
            children: [],
            uid: index++,
          };
          if (!isDirectory) {
            newDir.componentNodes = newDir.componentNodes ?? [];
            newDir.componentNodes.push(componentNode);
          }

          currentDir.push(newDir);
          currentDir = newDir.children;
        }
      });
    });

  return (
    <div
      className={
        "flex flex-col gap-1 w-[200px] rounded-xl shadow-lg px-1 py-1 transition-all duration-300 overflow-hidden hover:bg-gray-300 " +
        (isExpanded ? "bg-gray-300 max-h-dvh " : "bg-gray-100 max-h-[32px] ")
      }
    >
      <button
        className="flex flex-row gap-2 py-0.5 px-3 w-full text-sm rounded-sm cursor-pointer items-center font-[Inter] font-extrabold "
        onClick={() => setExpanded(!isExpanded)}
      >
        <div className="w-full">Files</div>
        <div className="absolute self-center p-1 rounded-full size-fit transition-all duration-100 bg-gray-100 text-gray-500 z-50 ">
          <FaAngleUp
            className={
              "transition-all duration-100 " +
              (isExpanded ? "rotate-0 " : "rotate-180 ")
            }
          />
        </div>
      </button>
      <div className="rounded-md overflow-hidden">
        <div
          className={
            "flex max-h-[calc(100dvh-550px)] overflow-auto flex-col gap-1 p-0.5 bg-[#fafafa] font-[JetBrains_Mono] text-left " +
            (isExpanded ? "min-h-[100px] " : " ")
          }
        >
          {directories.map((dir, i) => (
            <FileItem
              key={dir.name + i}
              directory={dir}
              onNodeClicked={onNodeClicked}
              onItemHovered={onItemHovered}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
