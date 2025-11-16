import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./Page/Login";
import Home from "./Page/Home";
import Quiz from "./Page/Quiz";
import Register from "./Page/Register";
import Details from "./Page/Details";
import Layout from "./Page/Layout";
import Liquor from "./Page/Liquor";
import { useState } from "react";

function App() {
  const [pageCount, setPageCount] = useState(1); 
  const [currentAlcoholList, setCurrentAlcoholList] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [currentAlcoholId, setCurrentAlcoholId] = useState("");

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<Layout />}>
            <Route
              path="/home"
              element={
                <Home
                  pageCount={pageCount}
                  setPageCount={setPageCount}
                  currentAlcoholList={currentAlcoholList}
                  setCurrentAlcoholList={setCurrentAlcoholList}
                  itemOffset={itemOffset}
                />
              }
            />
            <Route
              path="/liquor/:id"
              element={
                <Liquor
                  filteredAlcoholList={filteredAlcoholList}
                  setFilteredAlcoholList={setFilteredAlcoholList}
                  filteredItemOffset={filteredItemOffset}
                  setFilteredItemOffset={setFilteredItemOffset}
                  filteredItemsId={filteredItemsId}
                  setFilteredItemsId={setFilteredItemsId}
                />
              }
            />
            <Route
              path="/details/:id"
              element={
                <Details
                  dummyAlcoholList={dummyAlcoholList}
                  setDummyAlcoholList={setDummyAlcoholList}
                />
              }
            />
            <Route
              path="/quiz"
              element={
                <Quiz
                  dummyQuizList={dummyQuizList}
                  setDummyQuizList={setDummyQuizList}
                />
              }
            />
          </Route>
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
