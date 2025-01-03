import * as React from "react";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import "../Styles/trivia.css";
import { LinearProgress } from "@mui/material";
import { useRecoilValue } from "recoil";
import SuggestedItems from "../Component/SuggestedItems";
import filter from "../Entity/Filter";
import { aromaListState } from "../Store/selector";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../Firebase/service";

const Trivia = (sampleTriviaData, setSampleTriviaData) => {
  const [user, loading, error] = useAuthState(auth);
  const triviaData = require("../Asset/trivia-data.json");
  const mbtiData = require("../Asset/mbti.json");
  const [triviaNumber, settriviaNumber] = useState(0);
  const [conditionList, setConditionList] = useState([]);
  const [mbti, setMbti] = useState("");
  const [recommendedAromas, setRecommendedAromas] = useState([]);
  const aromaList = useRecoilValue(aromaListState);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      // maybe trigger a loading screen
      return;
    }
    if (!user) navigate("/");
  }, [user, loading]);

  useEffect(() => {
    if (triviaNumber === 8) {
      const filtered = aromaList.filter((_aroma) =>
        filter.matchConditions(_aroma, conditionList)
      );
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      setRecommendedAromas(selected);
      setSampleTriviaData(sampleTriviaData);
    }
  }, [triviaNumber, sampleTriviaData]);

  const onAnswerSelected = (triviaNumber, answer) => {
    if (triviaNumber % 2 !== 0) {
      setMbti(mbti + answer.condition);
    } else {
      const _conditionList = conditionList.slice();
      _conditionList.push(answer.condition);

      setConditionList(_conditionList);
    }

    settriviaNumber(triviaNumber + 1);
  };

  return (
    <>
      <div id="question-container">
        {triviaNumber === triviaData.length ? (
          <div id="result-container">
            <Typography
              variant="h6"
              fontWeight="bold"
              style={{ marginBottom: "5%" }}
            >
              향수 MBTI 결과
            </Typography>
            <Typography variant="h5" style={{ marginBottom: "5%" }}>
              🍷{mbtiData[mbti]}🥂 인
            </Typography>

            {recommendedAromas.length === 0 ? (
              <Typography variant="h6" style={{ marginBottom: "5%" }}>
                당신이 좋아할만한 향수를 찾지 못했어요.😭
                <br /> 조만간 더 좋은 향수를 찾아올게요!
              </Typography>
            ) : (
              <>
                <Typography variant="h6" style={{ marginBottom: "5%" }}>
                  당신에게 아래의 향수들을 추천합니다!
                </Typography>
                <div id="recommend-liquor">
                  <SuggestedItems
                    mbtiCharacter={mbtiData[mbti]}
                    aromas={recommendedAromas}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div id="question">
              <Typography variant="h5" style={{ marginBottom: "5%" }}>
                {triviaData[triviaNumber].question}
              </Typography>
            </div>
            <div id="answer">
              <Button
                id="answer-button"
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() =>
                  onAnswerSelected(
                    triviaNumber,
                    triviaData[triviaNumber].answers[0]
                  )
                }
              >
                {triviaData[triviaNumber].answers[0].text}
              </Button>
              <Button
                id="answer-button"
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() =>
                  onAnswerSelected(
                    triviaNumber,
                    triviaData[triviaNumber].answers[1]
                  )
                }
              >
                {triviaData[triviaNumber].answers[1].text}
              </Button>
              <LinearProgress
                style={{ width: "24rem" }}
                variant="determinate"
                color="secondary"
                value={((triviaNumber + 1) / triviaData.length) * 100}
              />
              <Typography id="question-count">
                {`${triviaNumber + 1} / ${triviaData.length}`}
              </Typography>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Trivia;
