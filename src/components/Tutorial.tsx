import { useState } from "react";
import TutorialExample1 from "./assets/TutorialExample1";
import TutorialExample2 from "./assets/TutorialExample2";
import TutorialExample3 from "./assets/TutorialExample3";

export default function Tutorial({}) {
  const [stage, setStage] = useState(0);

  const isClosed = stage > 7;

  return isClosed ? null : (
    <div
      className="absolute flex flex-row inset-0 size-full"
      onClick={() => setStage((stage) => stage + 1)}
    >
      <div className="absolute bottom-20 right-[5%] font-bold rounded-2xl bg-white/90 px-4 py-2 text-gray-800 cursor-default hover:bg-gray-300 z-10" onClick={() => setStage(8)}>
        Skip tutorial and continue HookLens ▶️
      </div>
      <div className="flex flex-col w-[230px] h-full">
        <div className={"h-12 " + (stage !== 0 ? "bg-black/20 " : "")}>
          <div
            className={
              "relative -right-60 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[300px] text-sm text-gray-900 transition-all duration-300 " +
              (stage !== 0 ? "opacity-0 " : "opacity-100 ")
            }
          >
            You can click the title to analyze a new project.
            <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
              Click anywhere to continue ▶️
            </div>
          </div>
        </div>
        <div
          className={
            "h-[165px] justify-center items-center transition-all duration-300 " +
            (stage !== 1 ? "bg-black/20 " : "")
          }
        >
          <div
            className={
              "relative -right-60 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[300px] text-sm text-gray-900 transition-all duration-300 " +
              (stage !== 1 ? "opacity-0 " : "opacity-100 ")
            }
          >
            You can navigate the diagram using mouse drag.
            <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
              Click anywhere to continue ▶️
            </div>
          </div>
        </div>
        <div
          className={
            "h-[293px] justify-center items-center transition-all duration-300 " +
            (stage !== 2 ? "bg-black/20 " : "")
          }
        >
          <div
            className={
              "relative -right-60 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[300px] text-sm text-gray-900 transition-all duration-300 " +
              (stage !== 2 ? "opacity-0 " : "opacity-100 ")
            }
          >
            You can check the information about nodes and edges here.
            <br />
            If you would like to close this panel, click the top area of this
            panel.
            <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
              Click anywhere to continue ▶️
            </div>
          </div>
        </div>
        <div
          className={
            "grow justify-center items-center transition-all duration-300 " +
            (stage !== 3 ? "bg-black/20 " : "")
          }
        >
          <div
            className={
              "relative -right-60 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[300px] text-sm text-gray-900 transition-all duration-300 " +
              (stage !== 3 ? "opacity-0 " : "opacity-100 ")
            }
          >
            You can explore the files in the project which involve component
            definitions.
            <br />
            If you would like to close this panel, click the top area of this
            panel.
            <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
              Click anywhere to continue ▶️
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col grow h-full">
        <div className="flex flex-row h-21">
          <div
            className={
              "flex justify-center items-center h-full w-135 transition-all duration-300 " +
              (stage !== 4 ? "bg-black/20 " : "")
            }
          >
            <div
              className={
                "relative top-46 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[600px] text-sm text-gray-900 transition-all duration-300 " +
                (stage !== 4 ? "opacity-0 " : "opacity-100 ")
              }
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-bold">Expand all, Collapse all</span>
                  <br />
                  You can expand or collapse all component nodes at once.
                </li>
                <li>
                  <span className="font-bold">Reset highlight</span>
                  <br />
                  You can reset the highlight status.
                </li>
                <li>
                  <span className="font-bold">Fit view</span>
                  <br />
                  You can adjust the view to show all nodes on the screen.
                </li>
                <li>
                  <span className="font-bold">Sort</span>
                  <br />
                  You can sort the nodes according their name or degrees.
                </li>
                <li>
                  <span className="font-bold">Code</span>
                  <br />
                  You can open the code viewer to see the source code of the
                  focused node.
                </li>
              </ul>
              <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
                Click anywhere to continue ▶️
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center h-full grow bg-black/20" />
          <div className="flex flex-col justify-center items-center h-full w-58">
            <div className="flex justify-center items-center h-2 w-full bg-black/20" />
            <div
              className={
                "flex justify-center items-center h-12 w-full transition-all duration-300 " +
                (stage !== 5 ? "bg-black/20 " : "")
              }
            >
              <div
                className={
                  "absolute top-13 right-0 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[300px] text-sm text-gray-900 transition-all duration-300 " +
                  (stage !== 5 ? "opacity-0 " : "opacity-100 ")
                }
              >
                You can adjust the gap between component nodes using the slider.
              </div>
            </div>
            <div className="flex justify-center items-center grow w-full bg-black/20" />
          </div>
        </div>
        <div
          className={
            "grow flex justify-center items-center transition-all duration-300 " +
            (stage !== 6 ? "bg-black/20 " : "")
          }
        >
          <div
            className={
              "absolute top-24 left-60 drop-shadow-2xl bg-white/90 rounded-md m-2 p-2 w-[400px] text-sm text-gray-900 transition-all duration-300 " +
              (stage !== 6 ? "opacity-0 " : "opacity-100 ")
            }
          >
            You can zoom in/out the diagram using mouse wheel.
            <br />
            You can navigate the diagram using mouse drag.
            <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
              Click anywhere to continue ▶️
            </div>
          </div>

          <div
            className={
              "absolute top-24 left-60 drop-shadow-2xl leading-6 bg-white/90 rounded-md m-2 p-2 w-[900px] text-sm text-gray-900 transition-all duration-300 " +
              (stage !== 7 ? "opacity-0 " : "opacity-100 ")
            }
          >
            You can click the nodes to expose details and highlight the things
            <br />
            Inside the expanded{" "}
            <span className="px-1 pb-1 ring-3 ring-[#f0f0f0] bg-white rounded-xl">
              component
            </span>{" "}
            node,{" "}
            <span className="px-1 pb-1 ring-3 text-white ring-[#f0f0f0] bg-[#eb9049] rounded-xl">
              prop
            </span>
            ,{" "}
            <span className="px-1 pb-1 ring-3 text-white ring-[#f0f0f0] bg-[#b7de90] rounded-xl">
              state
            </span>
            , and{" "}
            <span className="px-1 pb-1 ring-3 text-white ring-[#f0f0f0] bg-[#85b8e2] rounded-xl">
              effect
            </span>{" "}
            nodes are illustrated.
            <div className="my-2 flex flex-col gap-2 justify-center items-center">
              <TutorialExample1 />
              <TutorialExample2 />
            </div>
            <div>
              Potential dangers in nodes and edges are highlighted in red.{" "}
              <div>
                <TutorialExample3 />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold p-1 px-2 bg-gray-200 rounded-2xl w-fit cursor-default hover:bg-gray-300">
              Click to finish ▶️
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
