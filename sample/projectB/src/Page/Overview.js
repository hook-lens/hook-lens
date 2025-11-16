import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Rating } from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  useRecoilValue,
  useRecoilState,
  useRecoilRefresher_UNSTABLE,
} from "recoil";

import { aromaListState, rateListState } from "../Store/selector";
import postRate from "../Api/postRate";
import { useAuthState } from "react-firebase-hooks/auth";
import { Rate } from "../Entity/Rate";
import { auth } from "../Firebase/service";
import { currentAromaIdState } from "../Store/atom";
import KakaoRecommendButton from "../Component/KakaoRecommendButton";
import ScoreIndicator from "../Component/ScoreIndicator";

import magnifier from "../Asset/magnifier.png";

import "../Styles/Overview.css";

const Overview = ({ sampleAromaData, setSampleAromaData }) => {
  const [name, loaded, error] = useAuthState(auth);
  const aromaList = useRecoilValue(aromaListState);
  const [currentAromaId, setCurrentAromaId] =
    useRecoilState(currentAromaIdState);
  const commentListRefresh = useRecoilRefresher_UNSTABLE(rateListState);
  const commentList = useRecoilValue(rateListState);
  const [score, setScore] = useState(0);
  const [comment, setcomment] = useState("");
  const navigate = useNavigate();
  const top = useRef();

  let params = useParams();
  const currentAroma = aromaList.filter((_aroma) => _aroma.id === params.id)[0];

  const onChange = (e) => {
    setcomment(e.target.value);
  };

  const postComment = async () => {
    const timeStamp = new Date().getTime();
    postRate(
      new Rate(
        null,
        name.uid,
        name.displayName,
        currentAroma.id,
        score,
        comment,
        timeStamp
      )
    )
      .then(() => setcomment(""))
      .then(() => {
        commentListRefresh();
        setScore(0);
      });
  };

  useEffect(() => {
    top.current.focus();
    setCurrentAromaId(currentAroma.id);
  });

  useEffect(() => {
    if (loaded) {
      // maybe trigger a loading screen
      return;
    }
    if (!name) navigate("/");
  }, [name, loaded]);

  useEffect(() => {
    if (sampleAromaData.length > 0) {
      currentAroma = sampleAromaData.filter(
        (aroma) => aroma.id === params.id
      )[0];
    }
  }, [sampleAromaData]);

  return (
    <div ref={top}>
      <div className="overview">
        <div className="detailImage">
          <img
            className="aromaImage"
            referrerPolicy="no-referrer"
            src={currentAroma.imageUrl}
            alt=""
          />
        </div>
        <div className="detailRight">
          <h1 className="aromaName">{currentAroma.name}</h1>
          <div className="detailList">
            <h6>종류: {currentAroma.typeofaroma}</h6>
            <h6>부피: {currentAroma.volume}</h6>
            <h6>가격: {currentAroma.price}</h6>
            <p className="description">{currentAroma.description}</p>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <KakaoRecommendButton
          description={currentAroma.description}
          buttonTitle={"더 알아보기"}
          aroma={currentAroma}
        />
      </div>
      <br />
      <a
        className="naverLink"
        href={currentAroma.detailUrl}
        target="_blank"
        rel="noreferrer"
      >
        <img src={magnifier} className="magnifier" />
        <h2 className="naverUrl">네이버 지식백과로 더 자세히 알아보기</h2>
      </a>
      <div className="rate">
        <h5 className="rateHead">이 향수을 평가해주세요!</h5>
        <div className="rateDetails">
          <Rating
            className="rateStar"
            name="size-medium"
            defaultValue={0}
            size="small"
            value={score}
            onChange={(event, newValue) => {
              setScore(newValue);
            }}
          />
          <Input className="commentInput" onChange={onChange} value={comment} />
          <Button className="rateButton" onClick={postComment}>
            의견견 남기기
          </Button>
        </div>
        <div className="commentList">
          <h2 className="commentHeader">의견 목록</h2>
          <div className="commentMain">
            {commentList.map((comment) => {
              return (
                <>
                  <div className="commentBox">
                    <ScoreIndicator score={comment.numberOfStars} />
                    <Typography component="div" sx={{ width: "100%" }}>
                      <Typography
                        component="div"
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          width: "100%",
                        }}
                      >
                        <Typography
                          component="div"
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ fontWeight: 500, m: 1 }}>
                            {comment.userName}
                          </Box>
                          <Box
                            sx={{
                              fontWeight: "medium",
                              padding: "8px",
                              backgroundColor: "#b672ff",
                              color: "#ffffff",
                              borderRadius: "5px",
                              m: 1,
                            }}
                          >
                            {comment.commentText}
                          </Box>
                          <Typography
                            component="div"
                            sx={{
                              display: "flex",
                            }}
                          >
                            {" "}
                            <Box
                              sx={{
                                fontSize: "small",
                                fontWeight: "light",
                                textAlign: "right",
                                ml: 1,
                              }}
                            >
                              {new Date(comment.timestamp).toLocaleString()}
                            </Box>
                          </Typography>
                        </Typography>
                      </Typography>
                    </Typography>
                  </div>
                </>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
