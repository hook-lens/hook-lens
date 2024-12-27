import { useState, useEffect, useRef } from "react";

import "./App.css";
import HookExtractor from "./module/HookExtractor";
// import System from "./components/System";
import FlowView from "./components/FlowView";

import { DataProps } from "./types/data";

function App() {
  const [isVisualizationPage, setIsVisualizationPage] = useState(false);
  const [isVisualizationEnabled, setIsVisualizationEnabled] = useState(false);
  const hookExtractor = useRef(new HookExtractor());

  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<DataProps>();

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const handleFileUpload = (event: Event) => {
      if (!input.files) {
        return;
      }

      if (input.files.length > 0) {
        setIsVisualizationEnabled(true);
      } else {
        setIsVisualizationEnabled(false);
      }

      const files = input.files;
      const promises = [];
      for (let i = 0; i < files.length; i++) {
        if (
          !files[i].webkitRelativePath.includes("node_modules") &&
          (files[i].name.endsWith(".js") || files[i].name.endsWith(".jsx"))
        ) {
          promises.push(
            files[i].text().then((text) => ({
              source: files[i].webkitRelativePath,
              content: text,
            }))
          );
        }
      }

      Promise.all(promises).then((results) => {
        const extractor = hookExtractor.current;
        extractor.setProject(results);
        // extractor.print();
        // console.log(extractor.toJson());
        const data = extractor.toJson();
        setData(JSON.parse(data) as DataProps);
      });
    };

    input.addEventListener("change", handleFileUpload);

    return () => {
      input.removeEventListener("change", handleFileUpload);
    };
  }, [inputRef]);

  return (
    <div
      className={`App ${
        isVisualizationPage ? "visualization-page" : "upload-page"
      }`}
    >
      {isVisualizationPage && data ? (
        <div className="Visualization">
          {/* <System data={data} /> */}
          {/* 시각화 */}
          <FlowView hookExtractor={hookExtractor} />
        </div>
      ) : (
        <div className="Upload">
          <h1>HookLens</h1>
          <label htmlFor="file-input">Select File/Directory</label>
          <input
            type="file"
            id="file-input"
            webkitdirectory=""
            ref={inputRef}
          ></input>
          <button
            onClick={() => setIsVisualizationPage(true)}
            disabled={!isVisualizationEnabled}
          >
            Go To Visualization
          </button>
        </div>
      )}
    </div>
  );
}

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

export default App;
