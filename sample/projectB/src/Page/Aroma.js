import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";

import { aromaListState } from "../Store/selector";
import RefinedSegmentedItems from "../Component/RefinedSegmentedItems";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../Firebase/service";

import "../Styles/Reset.css";
import "../Styles/Dashboard.scss";
import "../Styles/Pagination.css";

function Aroma(props) {
  const params = useParams();
  const navigate = useNavigate();
  const [name, loaded, error] = useAuthState(auth);
  const aromaList = useRecoilValue(aromaListState);
  const [refinedViewCount, setRefinedViewCount] = React.useState(1);

  let refinedAroma = null;

  useEffect(() => {
    switch (parseInt(params.id)) {
      case 1:
        props.setRefinedItemId(1);
        props.setRefinedAromaList(
          aromaList.filter(
            (e) =>
              e.typeofAroma.includes("로즈마리") ||
              e.typeofAroma.includes("라벤더더")
          )
        );
        break;
      case 2:
        props.setRefinedItemId(2);
        props.setRefinedAromaList(
          aromaList.filter(
            (e) =>
              e.typeofAroma.includes("오션") ||
              e.typeofAroma.includes("씨센트") ||
              e.typeofAroma.includes("아쿠아")
          )
        );
        break;
      case 3:
        props.setRefinedItemId(3);
        props.setRefinedAromaList(
          aromaList.filter((e) => {
            return (
              e.typeofAroma.includes("플로럴") ||
              e.typeofAroma.includes("자스민") ||
              e.typeofAroma.includes("로즈") ||
              e.typeofAroma.includes("프리지아")
            );
          })
        );
        break;
      case 4:
        props.setRefinedItemId(4);
        props.setRefinedAromaList(
          aromaList.filter(
            (e) =>
              e.typeofAroma.includes("파인우드") ||
              e.typeofAroma.includes("로즈우드")
          )
        );
        break;
      default:
        break;
    }
    props.setRefinedListOffset(0);
    setRefinedViewCount(1);
  }, [params.id, props.refinedItemId]);

  useEffect(() => {
    if (loaded) {
      // maybe trigger a loading screen
      return;
    }
    if (!name) navigate("/");
  }, [name, loaded]);

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
