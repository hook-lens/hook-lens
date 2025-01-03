import React from "react";

const ScoreIndicator = (score) => {
  const result = [];
  for (let i = 0; i < score.score; i++) {
    result.push(<div>⭐</div>);
  }
  for (let i = 0; i < 5 - score.score; i++) {
    result.push(<div style={{ fontSize: "20px" }}>☆</div>);
  }
  console.log(result);
  return result;
};
export default ScoreIndicator;
