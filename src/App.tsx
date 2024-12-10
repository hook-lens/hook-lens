import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import HookExtractor from "./module/HookExtractor";

function App() {
  const [isVisualizationPage, setIsVisualizationPage] = useState(false);
  const [isVisualizationEnabled, setIsVisualizationEnabled] = useState(false);
  const hookExtractor = new HookExtractor();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const handleFileUpload = () => {
      if (input.files && input.files.length > 0) {
        setIsVisualizationEnabled(true);
      } else {
        setIsVisualizationEnabled(false);
      }

      if (input.files) {
        const files = input.files;
        const promises = [];
        for (let i = 0; i < files.length; i++) {
          if (files[i].name.endsWith(".js") || files[i].name.endsWith(".jsx")) {
            promises.push(files[i].text());
          }
        }

        Promise.all(promises).then((texts) => {
          texts.forEach((text, index) => {
            const filePath = input.files![index].name;
            hookExtractor.extractComponents(filePath, text);
          });

          hookExtractor.linkComponents();
          hookExtractor.linkEffects();
          hookExtractor.print();
          console.log(hookExtractor.toJson());
        });
      }
    };

    input.addEventListener("change", handleFileUpload);

    return () => {
      input.removeEventListener("change", handleFileUpload);
    };
  }, [inputRef]);

  return (
    <div className={`App ${isVisualizationPage ? "visualization-page" : "upload-page"}`}>
      {isVisualizationPage ? (
        <div className="Visualization">
          <h1>Visualization Page</h1>
          {/* 시각화 */}
        </div>
      ) : (
        <div className="Upload">
          <h1>HookLens</h1>
          <label htmlFor="file-input">Select Files</label>
          <input type="file" id="file-input" webkitdirectory="" ref={inputRef}></input>
          <button
            onClick={() => setIsVisualizationPage(true)}
            disabled={!isVisualizationEnabled}
          >
            Go to Visualization
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
