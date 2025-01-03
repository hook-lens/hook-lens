import * as React from "react";
import "../Styles/Reset.css";
import "../Styles/Home.css";
import { Link as RouterLink } from "react-router-dom";

function RefinedItems({ currentRefinedAromaList }) {
  return (
    <>
      {currentRefinedAromaList.map((aroma, idx) => {
        return (
          <RouterLink className="aroma-card" to={`/details/${aroma.id}`}>
            <div className="aroma-div">
              <img
                className="aroma-card-img"
                referrerPolicy="no-referrer"
                src={aroma.imageUrl}
              />
              <span style={{ fontWeight: "bold" }}>
                {aroma.name} | {aroma.price}원 <br></br>
              </span>
            </div>
          </RouterLink>
        );
      })}
    </>
  );
}

export default RefinedItems;
