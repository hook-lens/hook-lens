import { useState, useEffect, useRef } from "react";
import "./App.css";
import HookExtractor from "./module/HookExtractor";
// import System from "./components/System";
import FlowView from "./components/FlowView";
import { DataProps } from "./types/data";
import App2 from "./project/App2";
import FilteredItems from "./project/FilteredItems";
import Details from "./project/Details";
import FilteredPaginatedItems from "./project/FilteredPaginatedItems";
import Home from "./project/Home";
import Items from "./project/Items";
import KakaoRecommendButton from "./project/KakaoRecommendButton";
import KakaoShareButton from "./project/KakaoShareButton";
import Layout from "./project/Layout";
import Liquor from "./project/Liquor";
import Login from "./project/Login";
import PaginatedItems from "./project/PaginatedItems";
import Quiz from "./project/Quiz";
import QuizHeader from "./project/QuizHeader";
import RecommendItems from "./project/RecommendItems";
import Register from "./project/Register";
import StarRates from "./project/StarRates";

function App() {
  // const [isVisualizationPage, setIsVisualizationPage] = useState(false);
  // const [isVisualizationEnabled, setIsVisualizationEnabled] = useState(false);
  const hookExtractor = useRef(new HookExtractor());

  // const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<DataProps>();

  useEffect(() => {
    const fileList = [
      {
        name: "App2",
        text: () => Promise.resolve(App2),
      },
      {
        name: "Details",
        text: () => Promise.resolve(Details),
      },
      {
        name: "FilteredItems",
        text: () => Promise.resolve(FilteredItems),
      },
      {
        name: "FilteredPaginatedItems",
        text: () => Promise.resolve(FilteredPaginatedItems),
      },
      {
        name: "Home",
        text: () => Promise.resolve(Home),
      },
      {
        name: "Items",
        text: () => Promise.resolve(Items),
      },
      {
        name: "KakaoRecommendButton",
        text: () => Promise.resolve(KakaoRecommendButton),
      },
      {
        name: "KakaoShareButton",
        text: () => Promise.resolve(KakaoShareButton),
      },
      {
        name: "Layout",
        text: () => Promise.resolve(Layout),
      },
      {
        name: "Liquor",
        text: () => Promise.resolve(Liquor),
      },
      {
        name: "Login",
        text: () => Promise.resolve(Login),
      },
      {
        name: "PaginatedItems",
        text: () => Promise.resolve(PaginatedItems),
      },
      {
        name: "Quiz",
        text: () => Promise.resolve(Quiz),
      },
      {
        name: "QuizHeader",
        text: () => Promise.resolve(QuizHeader),
      },
      {
        name: "RecommendItems",
        text: () => Promise.resolve(RecommendItems),
      },
      {
        name: "Register",
        text: () => Promise.resolve(Register),
      },
      {
        name: "StarRates",
        text: () => Promise.resolve(StarRates),
      },
    ];

    const promises = fileList.map((file) => {
      return file.text().then((text) => ({
        source: file.name,
        content: text,
      }));
    });

    Promise.all(promises).then((results) => {
      const extractor = hookExtractor.current;
      extractor.setProject(results);
      const extractedData = extractor.toJson();
      setData(JSON.parse(extractedData) as DataProps);
      // setIsVisualizationEnabled(true);
    });
  }, []);

  // useEffect(() => {
  //   const input = inputRef.current;

  //   if (!input) {
  //     return;
  //   }

  //   const handleFileUpload = (event: Event) => {
  //     if (!input.files) {
  //       return;
  //     }

  //     if (input.files.length > 0) {
  //       setIsVisualizationEnabled(true);
  //     } else {
  //       setIsVisualizationEnabled(false);
  //     }

  //     const files = input.files;
  //     console.log("file", files);
  //     const promises = [];
  //     for (let i = 0; i < files.length; i++) {
  //       if (
  //         !files[i].webkitRelativePath.includes("node_modules") &&
  //         (files[i].name.endsWith(".js") || files[i].name.endsWith(".jsx"))
  //       ) {
  //         promises.push(
  //           files[i].text().then((text) => ({
  //             source: files[i].webkitRelativePath,
  //             content: text,
  //           }))
  //         );
  //       }
  //     }

  //     Promise.all(promises).then((results) => {
  //       const extractor = hookExtractor.current;
  //       extractor.setProject(results);
  //       // extractor.print();
  //       // console.log(extractor.toJson());
  //       const data = extractor.toJson();
  //       setData(JSON.parse(data) as DataProps);
  //     });
  //   };

  //   input.addEventListener("change", handleFileUpload);

  //   return () => {
  //     input.removeEventListener("change", handleFileUpload);
  //   };
  // }, [inputRef]);

  return (
    // <div
    //   className={`App ${
    //     isVisualizationPage ? "visualization-page" : "upload-page"
    //   }`}
    // >
    //   {isVisualizationPage && data ? (
    //     <div className="Visualization">
    //       {/* <System data={data} /> */}
    //       {/* 시각화 */}
    //       <FlowView hookExtractor={hookExtractor} />
    //     </div>
    //   ) : (
    //     <div className="Upload">
    //       <h1>HookLens</h1>
    //       <label htmlFor="file-input">Select File/Directory</label>
    //       <input
    //         type="file"
    //         id="file-input"
    //         webkitdirectory=""
    //         ref={inputRef}
    //       ></input>
    //       <button
    //         onClick={() => setIsVisualizationPage(true)}
    //         disabled={!isVisualizationEnabled}
    //       >
    //         Go To Visualization
    //       </button>
    //     </div>
    //   )}
    // </div>

    <div className="App visualization-page">
      {data ? (
        <div className="Visualization">
          <FlowView hookExtractor={hookExtractor} />
        </div>
      ) : (
        <div>Loading...</div>
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
