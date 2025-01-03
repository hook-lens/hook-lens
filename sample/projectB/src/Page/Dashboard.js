import { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper";
import { useRecoilValue, useRecoilState } from "recoil";

import { auth } from "../Firebase/service";
import { aromaListState } from "../Store/selector";
import SegmentedItems from "../Component/SegmentedItems";

import aroma_icon from "../Asset/aroma-icon.png";
import aroma_1 from "../Asset/aroma-1.png";
import aroma_2 from "../Asset/aroma-2.png";
import aroma_3 from "../Asset/aroma-3.png";
import aroma_4 from "../Asset/aroma-4.png";
import gift from "../Asset/gift.png";
import party from "../Asset/party.png";
import dinner from "../Asset/dinner.png";
import newspaper from "../Asset/newspaper.png";
import ricewine from "../Asset/ricewine.png";
import newsThumbnail_1 from "../Asset/news-thumbnail-1.jpeg";
import newsThumbnail_2 from "../Asset/news-thumbnail-2.jpeg";

import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css";
import "../Styles/Reset.css";
import "../Styles/Dashboard.scss";

const Dashboard = (props) => {
  const [name, loaded, error] = useAuthState(auth);
  const aromaList = useRecoilValue(aromaListState);
  const navigate = useNavigate();

  const randomizedIndices = [];
  while (randomizedIndices.length < 4) {
    const rand = Math.floor(Math.random() * 100);
    if (randomizedIndices.indexOf(rand) === -1) {
      randomizedIndices.push(rand);
    }
  }

  useEffect(() => {
    if (loaded) {
      // maybe trigger a loading screen
      return;
    }
    if (!name) navigate("/");
  }, [name, loaded]);

  useEffect(() => {
    if (props.typeFilter !== 0) {
      const aromas = document.querySelector("#aroma-card-wrapper-text");
      aromas.scrollIntoView();
    }

    if (props.listOffset > 0) {
      console.info("scrolling to top");
    }
  }, [props.typeFilter, props.listOffset]);

  return (
    <div style={{ height: "100vh" }}>
      <div id="aroma-swiper">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          observer={true}
          observeParents={true}
          parallax={true}
          autoplay={true}
          id="swiper"
          slidesPerView={1}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          pagination={{
            el: ".swiper-pagination",
            clickable: true,
          }}
        >
          <div id="swiper-wrapper">
            <SwiperSlide>
              <img className="aroma" id="aroma-1" src={aroma_1} alt="" />
              <span id="aroma-1-text">
                상쾌한 아침을 연상시키는 향수<br></br>향수 성향검사사로 나만의 향수를 찾아보세요<br></br>
                <RouterLink
                  id="aroma-1-quiz"
                  style={{ borderRadius: "5%" }}
                  component={RouterLink}
                  to="/quiz"
                >
                  향수 성향검사사 검사하러 가기
                </RouterLink>
              </span>
            </SwiperSlide>
            <SwiperSlide>
              <img className="aroma" id="aroma-2" src={aroma_2} alt="" />
              <span id="aroma-2-text">
                맑은 시냇물을 연상시키는 향수<br></br>향수 성향검사사로 '나의 향수' 찾기
                <RouterLink
                  id="aroma-2-quiz"
                  style={{ borderRadius: "3%" }}
                  component={RouterLink}
                  to="/quiz"
                >
                  향수 성향검사사 검사하러 가기
                </RouterLink>
              </span>
            </SwiperSlide>
            <SwiperSlide>
              <img className="aroma" id="aroma-3" src={aroma_3} alt="" />
              <span id="aroma-3-text">
                정갈하지만 강력한 향수<br></br>
                나만의 향수 찾기
                <RouterLink
                  id="aroma-3-quiz"
                  style={{ borderRadius: "3%" }}
                  component={RouterLink}
                  to="/quiz"
                >
                  향수 성향검사사 검사하러 가기
                </RouterLink>
              </span>
            </SwiperSlide>
            <SwiperSlide>
              <img className="aroma" id="aroma-4" src={aroma_4} alt="" />
              <span id="aroma-4-text">
                우리 꽃으로 만들어진 더 향기로운 향수<br></br>향수 성향검사사로 나만의 향수 찾기
                <RouterLink
                  id="aroma-4-quiz"
                  style={{ borderRadius: "3%" }}
                  component={RouterLink}
                  to="/triva"
                >
                  향수 성향검사사 검사하러 가기
                </RouterLink>
              </span>
            </SwiperSlide>
          </div>
          <div className="swiper-button-prev"></div>
          <div className="swiper-button-next"></div>
        </Swiper>
      </div>
      <div className="experience-container">
        <div className="experiences" id="experience-1">
          <img className="experience-img" src={dinner} alt="" />
          <span style={{ fontSize: "85%" }}>
            당신의 근사한 저녁을 책임질 주인공<br></br>향수를 초대해보세요.
          </span>
        </div>
        <div className="experiences" id="experience-2">
          <img className="experience-img" src={gift} alt="" />
          <span>
            항상 소중한 사람<br></br>향수 선물로 마음을 표현하세요.
          </span>
        </div>
        <div className="experiences" id="experience-3">
          <img className="experience-img" src={party} alt="" />
          <span>
            파티에 빠지면 서운한 세글자<br></br>향.수
          </span>
        </div>
      </div>
      <div className="popular-section">
        <img id="popular-aroma-icon" src={aroma_icon} alt="aroma" />
        <h1 style={{ fontSize: "200%" }}>
          현재 <span style={{ color: "#bb17ff" }}>HOT</span>한 향수
        </h1>
        <div className="popular-wrapper">
          {randomizedIndices.map((rand) => (
            <RouterLink
              className="popular"
              component={RouterLink}
              to={`/overview/${aromaList[rand].id}`}
            >
              <img
                className="popular-img"
                referrerPolicy="no-referrer"
                src={aromaList[rand].imageUrl}
              />
              <span className="popular-text">
                {aromaList[rand].name} | {aromaList[rand].price}원{" "}
              </span>
            </RouterLink>
          ))}
        </div>
      </div>
      <div className="latest-news">
        <img id="newspaper-img" src={newspaper} alt="" />
        <h1 style={{ fontSize: "200%" }}>
          <span style={{ fontWeight: "bold" }}>뉴스</span>에 소개된 우리의{" "}
          <span style={{ fontWeight: "bold" }}>향수</span>
        </h1>
        <div className="news-wrapper">
          <div className="news">
            <img
              src={newsThumbnail_1}
              onClick={() =>
                window.open(
                  "https://bravo.etoday.co.kr/view/atc_view.php?varAtcId=13615"
                )
              }
              className="news-image"
            />
            <span>
              <a href="https://bravo.etoday.co.kr/view/atc_view.php?varAtcId=13615">
                [카드뉴스] 문헌 밖으로 나온 ‘전설의 향수’
              </a>
            </span>
          </div>
          <div className="news">
            <img
              src={newsThumbnail_2}
              onClick={() =>
                window.open(
                  "https://biz.chosun.com/distribution/channel/2022/05/24/NKCSKQ7HEFEJZCD2JKGEHCUNE4/?utm_source=naver&utm_medium=original&utm_campaign=biz"
                )
              }
              className="news-image"
            />
            <span>
              <a href="https://biz.chosun.com/distribution/channel/2022/05/24/NKCSKQ7HEFEJZCD2JKGEHCUNE4/?utm_source=naver&utm_medium=original&utm_campaign=biz">
                신세계 백화점 차별화된 한국만의 향을 담은 고급 향수 경쟁
              </a>
            </span>
          </div>
        </div>
      </div>

      <img id="ricewine-icon" src={ricewine} alt="aroma" />
      <h1 style={{ fontSize: "200%" }} id="aroma-card-wrapper-text">
        <span style={{ fontWeight: "bold" }}>향수</span> 둘러보기
      </h1>
      <SegmentedItems itemsPerView={28} {...props} />
    </div>
  );
};

export default Dashboard;
