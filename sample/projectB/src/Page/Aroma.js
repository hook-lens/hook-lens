import * as React from "react";
import "../Styles/Reset.css";
import "../Styles/Home.scss";
import "../Styles/Pagination.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { aromaListState } from "../Store/selector";
import RefinedSegmentedItems from "../Component/RefinedSegmentedItems";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../Firebase/service";

function Aroma(props) {
  const [user, loading, error] = useAuthState(auth);
  const aromaList = useRecoilValue(aromaListState);
  const [refinedViewCount, setRefinedViewCount] = React.useState(1);

  let refinedAroma = null;
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      // maybe trigger a loading screen
      return;
    }
    if (!user) navigate("/");
  }, [user, loading]);

  useEffect(() => {
    if (parseInt(params.id) === 1) {
      props.setRefinedItemId(1);
      props.setRefinedAromaList(
        aromaList.filter(
          (e) =>
            e.typeofAroma.includes("탁주") || e.typeofAroma.includes("막걸리")
        )
      );
    } else if (parseInt(params.id) === 2) {
      props.setRefinedItemId(2);
      props.setRefinedAromaList(
        aromaList.filter(
          (e) =>
            e.typeofAroma.includes("청주") ||
            e.typeofAroma.includes("약주") ||
            e.typeofAroma.includes("기타주류")
        )
      );
    } else if (parseInt(params.id) === 3) {
      props.setRefinedItemId(3);
      props.setRefinedAromaList(
        aromaList.filter((e) => {
          return (
            e.typeofAroma.includes("과실") ||
            e.typeofAroma.includes("와인") ||
            e.typeofAroma.includes("브랜디")
          );
        })
      );
    } else if (parseInt(params.id) === 4) {
      props.setRefinedItemId(4);
      props.setRefinedAromaList(
        aromaList.filter(
          (e) =>
            e.typeofAroma.includes("증류") ||
            e.typeofAroma.includes("소주") ||
            e.typeofAroma.includes("리큐르")
        )
      );
    }
    props.setRefinedListOffset(0);
    setRefinedViewCount(1);
  }, [params.id, props.refinedItemId]);

  return (
    <>
      <RefinedSegmentedItems
        itemsPerView={28}
        viewCount={refinedViewCount}
        setViewCount={setRefinedViewCount}
        aromaList={props.refinedAromaList}
      />
    </>
  );
}

export default Aroma;
