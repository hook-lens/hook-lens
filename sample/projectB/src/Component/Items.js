import * as React from "react";

import { Link as RouterLink } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { aromaListState } from "../Store/selector";

import "../Styles/Reset.css";
import "../Styles/Dashboard.css";

function Items({ listOffset, activeItems }) {
  const aromaList = useRecoilValue(aromaListState);
  const onClick = (index) => {
    if (localStorage.getItem("aromas")) {
      const aromas = JSON.parse(localStorage.getItem("aromas"));
      aromas.push(index);
      localStorage.setItem("aromas", JSON.stringify(aromas));
    } else {
      const aromas = [];
      aromas.push = index;
      localStorage.setItem("aromas", JSON.stringify(aromas));
    }
  };
  const currentView = document.querySelector(".currentView");
  const curr_view = currentView ? currentView.innerText : 1;
  return (
    <>
      {activeItems.map((aroma, i) => {
        return (
          <RouterLink
            className="aroma-card"
            to={`/overview/${aromaList[parseInt(curr_view) * 28 - 28 + i].id}`}
          >
            <div
              className="aroma-div"
              onClick={() =>
                onClick(i, parseInt(curr_view) * 28 - 28 + i)
              }
            >
              <img
                className="aroma-card-img"
                referrerPolicy="no-referrer"
                src={aroma.imageUrl}
              />
              <span style={{ fontWeight: "bold" }}>
                No. {listOffset}: {aroma.name} | {aroma.price}원 <br></br>
              </span>
            </div>
          </RouterLink>
        );
      })}
    </>
  );
}

export default Items;
