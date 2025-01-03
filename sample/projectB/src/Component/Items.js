import * as React from "react";
import "../Styles/Reset.css";
import "../Styles/Home.css";
import { Link as RouterLink } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { aromaListState } from "../Store/selector";

function Items({ activeItems, listOffset }) {
  const aromaList = useRecoilValue(aromaListState);
  const onClickItem = (idx, num) => {
    if (localStorage.getItem("aromas") === null) {
      const aromas = [];
      aromas.push = idx;
      localStorage.setItem("aromas", JSON.stringify(aromas));
    } else {
      const aromas = JSON.parse(localStorage.getItem("aromas"));
      aromas.push(idx);
      localStorage.setItem("aromas", JSON.stringify(aromas));
    }
  };
  const currentView = document.querySelector(".currentView");
  const curr_view = currentView ? currentView.innerText : 1;
  return (
    <>
      {activeItems.map((aroma, idx) => {
        return (
          <RouterLink
            className="aroma-card"
            to={`/details/${aromaList[parseInt(curr_view) * 28 - 28 + idx].id}`}
          >
            <div
              className="aroma-div"
              onClick={() =>
                onClickItem(idx, parseInt(curr_view) * 28 - 28 + idx)
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
