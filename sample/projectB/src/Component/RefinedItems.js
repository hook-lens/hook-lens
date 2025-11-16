import { Link as RouterLink } from "react-router-dom";

import "../Styles/Reset.css";
import "../Styles/Dashboard.css";

function RefinedItems({ currentRefinedAromaList }) {
  return (
    <>
      {currentRefinedAromaList.map((aroma, i) => {
        return (
          <RouterLink className="aroma-card" to={`/overview/${aroma.id}`}>
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
