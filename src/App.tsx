import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

import { DataProps } from "./types/data";
import HookExtractor from "./module/HookExtractor";
import MainView from "./components/MainView";
import { fetchGitHubFiles } from "./utils/fetchGithubProjects";

import "./App.css";

function App() {
  const hookExtractor = useRef(new HookExtractor());

  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<DataProps>();
  const [repoUrl, setRepoUrl] = useState("");
  const [progress, setProgress] = useState<{ progress: number; total: number }>(
    { progress: 0, total: 0 }
  );

  const resetApp = () => {
    hookExtractor.current = new HookExtractor();
    setData(undefined);
    setRepoUrl("");
    setProgress({ progress: 0, total: 0 });
  };

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const handleFileUpload = () => {
      console.log("Files selected");
      if (!input.files) {
        return;
      }

      const files = input.files;
      const promises = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].webkitRelativePath.includes("node_modules")) {
          continue;
        }

        const name = files[i].name;
        if (
          name.endsWith(".js") ||
          name.endsWith(".ts") ||
          name.endsWith(".jsx") ||
          name.endsWith(".tsx")
        ) {
          promises.push(
            files[i].text().then((text) => ({
              filePath: files[i].webkitRelativePath,
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
  }, [inputRef.current, hookExtractor.current]);

  return data ? (
    <div className="w-full h-dvh">
      <ReactFlowProvider>
        <MainView hookExtractor={hookExtractor} resetApp={resetApp} />
      </ReactFlowProvider>
    </div>
  ) : (
    <div className="text-center flex flex-col gap-5 items-center justify-center bg-slate-800 min-h-dvh">
      <h1 className="font-[Inter] font-extrabold text-5xl text-gray-50 drop-shadow-lg">
        HookLens
      </h1>
      <label
        className="text-slate-800 font-[Inter] font-semibold text-lg shadow rounded-sm py-2 px-5 bg-slate-300 hover:bg-gray-500 hover:text-slate-300 transition-all duration-100 cursor-pointer"
        htmlFor="file-input"
      >
        Select Directory
      </label>
      <input
        className="hidden"
        type="file"
        id="file-input"
        webkitdirectory=""
        ref={inputRef}
      ></input>
      <p className="text-slate-300 font-[Inter] font-semibold text-lg">or</p>
      <button
        className="mt-2 text-slate-800 font-[Inter] font-semibold text-lg shadow rounded-sm py-2 px-5 bg-slate-300 hover:bg-gray-500 hover:text-slate-300 transition-all duration-100 cursor-pointer"
        onClick={async () => {
          const result = await fetchGitHubFiles(
            repoUrl,
            hookExtractor.current,
            setProgress
          );
          if (result) {
            setData(result);
          }
        }}
      >
        Load from GitHub
      </button>
      <input
        className="text-sm p-2 border border-gray-400 rounded bg-white w-96"
        type="text"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="https://github.com/user/repo"
      />
      {progress.total > 0 && progress.progress < progress.total && (
        <div className="flex flex-col items-center mt-5 gap-2">
          <progress
            value={progress.progress}
            max={progress.total}
            className="w-64"
          />
          <p className="text-white text-sm">
            {progress.progress} / {progress.total} files loaded
          </p>
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
