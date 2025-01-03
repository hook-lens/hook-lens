import { useState, useEffect } from "react";
import "../Styles/Reset.css";
import "../Styles/Trivia.css";
import KakaoRecommendButton from "./KakaoRecommendButton";
import { Link as RouterLink } from "react-router-dom";

const SuggestedItems = ({ aromaPreference, aromas }) => {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setRecommended(aromas);
    console.log(aromas);
  }, [aromas]);

  return (
    <>
      {aromas.map((aroma) => {
        return (
          <div>
            <RouterLink
              className="aroma-card"
              to={`/overview/${aroma.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <img
                className="aroma-card-img"
                referrerPolicy="no-referrer"
                src={aroma.imageUrl}
              />
              <span style={{ fontWeight: "bold" }}>
                {aroma.name} | {aroma.price}원 <br />
                <br />
              </span>
            </RouterLink>
            <KakaoRecommendButton
              description={`${aromaPreference}인 당신에게 추천하는 향수!`}
              buttonTitle={"향수 성향검사로 향수 추천받기"}
              aroma={aroma}
              recommended={recommended}
            />
          </div>
        );
      })}
    </>
  );
};

export default SuggestedItems;
