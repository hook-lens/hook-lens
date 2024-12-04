import React, { useEffect } from "react";
import "./App.css";
import * as acorn from "acorn";
import HookExtractor from "./module/HookExtractor";


function App() {
  const hookExtractor = new HookExtractor();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const asts: { filePath: string; ast: acorn.Node }[] = [];

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const handleFileUpload = (event: Event) => {
      if (input.files) {
        console.log("inputRef", input.files);
        const files = input.files;
        const promises = [];
        for (let i = 0; i < files.length; i++) {
          if (files[i].name.endsWith(".js") || files[i].name.endsWith(".jsx")) {
            promises.push(files[i].text());
          }
        }

        Promise.all(promises).then((texts) => {
          for (const text of texts) {
            const ast = hookExtractor.parseJsFile(text);
            asts.push({ filePath: "", ast: ast });
            hookExtractor.extract(ast);
          }

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
    <div className="App">
      <div>Hello world</div>
      <input type="file" webkitdirectory="" ref={inputRef}></input>
    </div>
  );
}

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

export default App;
