import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input, Rating } from "@mui/material";
import { auth } from "../Firebase/service";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import magnifier from "../Asset/magnifier.png";
import ScoreIndicator from "../Component/ScoreIndicator";
import "../Styles/Details.css";
import { useState, useRef, useEffect } from "react";
import {
  useRecoilValue,
  useRecoilState,
  useRecoilRefresher_UNSTABLE,
} from "recoil";
import { aromaListState, rateListState } from "../Store/selector";
import postRate from "../Api/postRate";
import { useAuthState } from "react-firebase-hooks/auth";
import { Rate } from "../Entity/Rate";
import { currentAromaIdState } from "../Store/atom";
import KakaoRecommendButton from "../Component/KakaoRecommendButton";

const Overview = ({ sampleAromaData, setSampleAromaData }) => {
  const [user, loading, error] = useAuthState(auth);
  const aromaList = useRecoilValue(aromaListState);
  let params = useParams();
  const currentAroma = aromaList.filter((_aroma) => _aroma.id === params.id)[0];
  const top = useRef();
  const [score, setScore] = useState(0);
  const [comment, setcomment] = useState("");
  const [currentAromaId, setCurrentAromaId] =
    useRecoilState(currentAromaIdState);
  const commentList = useRecoilValue(rateListState);
  const commentListRefresh = useRecoilRefresher_UNSTABLE(rateListState);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      // maybe trigger a loading screen
      return;
    }
    if (!user) navigate("/");
  }, [user, loading]);

  useEffect(() => {
    if (sampleAromaData.length > 0) {
      currentAroma = sampleAromaData.filter(
        (_aroma) => _aroma.id === params.id
      )[0];
    }
  }, [sampleAromaData]);

  useEffect(() => {
    top.current.focus();
    setCurrentAromaId(currentAroma.id);
  });

  const onChange = (e) => {
    setcomment(e.target.value);
  };
  const postcomment = async () => {
    const timeStamp = new Date().getTime();
    postRate(
      new Rate(
        null,
        user.uid,
        user.displayName,
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
  return (
    <div ref={top}>
      <div className="details">
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
          <Button className="rateButton" onClick={postcomment}>
            리뷰 남기기
          </Button>
        </div>
        <div className="commentList">
          <h2 className="commentHeader">리뷰 목록</h2>
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
