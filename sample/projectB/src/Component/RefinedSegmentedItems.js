import { useEffect, useState, useRef } from "react";
import ReactPaginate from "react-paginate";
import RefinedItems from "./RefinedItems";

import "../Styles/Dashboard.scss";
import "../Styles/Pagination.css";
import "../Styles/Reset.css";

function RefinedSegmentedItems(props) {
  const [currentRefinedAromaList, setCurrentRefinedAromaList] = useState(
    []
  );
  const [RefinedItemOffset, setRefinedItemOffset] = useState(0);
  const scrollToRef = useRef();

  const handleViewClick = (e) => {
    const offset =
      (e.selected * props.itemsPerView) % props.aromaList.length;
    setRefinedItemOffset(offset);
  };

  useEffect(() => {
    const RefinedEndOffset = RefinedItemOffset + props.itemsPerView;
    setCurrentRefinedAromaList(
      props.aromaList.slice(RefinedItemOffset, RefinedEndOffset)
    );
    props.setViewCount(Math.ceil(props.aromaList.length / props.itemsPerView));
  }, [props.aromaList, RefinedItemOffset, props.itemsPerView]);

  return (
    <>
      <div ref={scrollToRef} className="aroma-card-wrapper">
        <RefinedItems currentRefinedAromaList={currentRefinedAromaList} />
      </div>
      <div className="footer">
        <ReactPaginate
          breakLabel="..."
          nextLabel=">"
          onViewChange={handleViewClick}
          ViewRangeDisplayed={5}
          ViewCount={props.ViewCount}
          previousLabel="<"
          renderOnZeroViewCount={null}
          containerClassName={"pagination-ul"}
          activeClassName={"currentView"}
          previousClassName={"ViewLabel-btn"}
          nextClassName={"ViewLabel-btn"}
          onClick={() =>
            scrollToRef.current.scrollIntoView({ behavior: "smooth" })
          }
        />
      </div>
    </>
  );
}

export default RefinedSegmentedItems;
