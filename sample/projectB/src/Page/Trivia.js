import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { LinearProgress } from "@mui/material";
import { useRecoilValue } from "recoil";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

import { aromaListState } from "../Store/selector";
import SuggestedItems from "../Component/SuggestedItems";
import filter from "../Entity/Filter";
import { auth } from "../Firebase/service";

import "../Styles/Trivia.css";

const Trivia = (sampleTriviaData, setSampleTriviaData) => {
  const [name, loaded, error] = useAuthState(auth);
  const triviaData = require("../Asset/trivia-data.json");
  const preferenceData = require("../Asset/mbti.json");

  const aromaList = useRecoilValue(aromaListState);
  const navigate = useNavigate();

  const [triviaNumber, settriviaNumber] = useState(0);
  const [conditionList, setConditionList] = useState([]);
  const [preference, setPreference] = useState("");
  const [recommendedAromas, setRecommendedAromas] = useState([]);

  const onAnswerSelected = (triviaNumber, answer) => {
    if (triviaNumber % 2 === 0) {
      const slicedConditionList = conditionList.slice();
      slicedConditionList.push(answer.condition);
      
      setConditionList(slicedConditionList);
    } else {
      setPreference(preference + answer.condition);
    }

    settriviaNumber(triviaNumber + 1);
  };

  useEffect(() => {
    if (loaded) {
      // maybe trigger a loading screen
      return;
    }
    if (!name) navigate("/");
  }, [name, loaded]);

  useEffect(() => {
    if (triviaNumber === 8) {
      const filtered = aromaList.filter((aroma) =>
        filter.matchConditions(aroma, conditionList)
      );
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      setRecommendedAromas(selected);
      setSampleTriviaData(sampleTriviaData);
    }
  }, [triviaNumber, sampleTriviaData]);

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
              향수 성향검사 결과
            </Typography>
            <Typography variant="h5" style={{ marginBottom: "5%" }}>
              🍷{preferenceData[preference]}🥂 인
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
                <div id="recommend-aroma">
                  <SuggestedItems
                    aromaPreference={preferenceData[preference]}
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
