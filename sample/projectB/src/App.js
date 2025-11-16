import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./Page/Login";
import Dashboard from "./Page/Dashboard";
import Trivia from "./Page/Trivia";
import SignUp from "./Page/SignUp";
import Overview from "./Page/Overview";
import Framework from "./Page/Framework";
import Aroma from "./Page/Aroma";
import { useState } from "react";

function App() {
  const [sampleAromaData, setSampleAromaData] = useState(
    require("./Asset/sample-aromas.json")
  );
  const [sampleTriviaData, setSampleTriviaData] = useState(
    require("./Asset/sample-trivia.json")
  );

  const [activeAromaList, setActiveAromaList] = useState([]);
  const [listOffset, setListOffset] = useState(0);
  const [selectedAromaId, setSelectedAromaId] = useState("");
  const [typeFilter, setTypeFilter] = useState(0);
  const [refinedAromaList, setRefinedAromaList] = useState([]);
  const [refinedListOffset, setRefinedListOffset] = useState(0);
  const [refinedItemId, setRefinedItemId] = useState(0);
  const [viewCount, setViewCount] = useState(1);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<Framework />}>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  viewCount={viewCount}
                  setViewCount={setViewCount}
                  activeAromaList={activeAromaList}
                  setActiveAromaList={setActiveAromaList}
                  listOffset={listOffset}
                  setListOffset={setListOffset}
                  typeFilter={typeFilter}
                />
              }
            />
            <Route
              path="/aroma/:id"
              element={
                <Aroma
                  refinedAromaList={refinedAromaList}
                  setRefinedAromaList={setRefinedAromaList}
                  refinedListOffset={refinedListOffset}
                  setRefinedListOffset={setRefinedListOffset}
                  refinedItemId={refinedItemId}
                  setRefinedItemId={setRefinedItemId}
                />
              }
            />
            <Route
              path="/trivia"
              element={
                <Trivia
                  sampleTriviaData={sampleTriviaData}
                  setSampleTriviaData={setSampleTriviaData}
                />
              }
            />
            <Route
              path="/overview/:id"
              element={
                <Overview
                  sampleAromaData={sampleAromaData}
                  setSampleAromaData={setSampleAromaData}
                />
              }
            />
          </Route>
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
