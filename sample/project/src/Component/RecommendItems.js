import React, { useState, useEffect } from "react";
import "../Styles/Reset.css";
import "../Styles/Quiz.css";
import KakaoRecommendButton from "./KakaoRecommendButton";
import { Link as RouterLink } from "react-router-dom";

const RecommendItems = ({ mbtiCharacter, alcohols }) => {
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setRecommended(alcohols);
    console.log(alcohols);
  }, [alcohols]);

  return (
    <>
      {alcohols.map((alcohol) => {
        return (
          <div>
            <RouterLink
              className="liquor-card"
              to={`/details/${alcohol.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <img
                className="liquor-card-img"
                referrerPolicy="no-referrer"
                src={alcohol.imageUrl}
              />
              <span style={{ fontWeight: "bold" }}>
                {alcohol.name} | {alcohol.price}원 <br />
                <br />
              </span>
            </RouterLink>
            <KakaoRecommendButton
              description={`${mbtiCharacter}인 당신에게 추천하는 전통술!`}
              buttonTitle={"술 MBTI로 전통술 추천받기"}
              alcohol={alcohol}
              recommended={recommended}
            />
          </div>
        );
      })}
    </>
  );
};

export default RecommendItems;
