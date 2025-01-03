import * as React from "react";
import ReactPaginate from "react-paginate";
import { useEffect, useRef } from "react";
import RefinedItems from "./RefinedItems";
import "../Styles/Home.scss";
import "../Styles/Pagination.css";
import "../Styles/Reset.css";

function RefinedSegmentedItems(props) {
  const [currentRefinedAromaList, setCurrentRefinedAromaList] = React.useState(
    []
  );
  const [RefinedItemOffset, setRefinedItemOffset] = React.useState(0);
  const scrollToRef = useRef();

  useEffect(() => {
    const RefinedEndOffset = RefinedItemOffset + props.itemsPerView;
    setCurrentRefinedAromaList(
      props.aromaList.slice(RefinedItemOffset, RefinedEndOffset)
    );
    props.setViewCount(Math.ceil(props.aromaList.length / props.itemsPerView));
  }, [props.aromaList, RefinedItemOffset, props.itemsPerView]);

  const handleViewClick = (event) => {
    const newOffset =
      (event.selected * props.itemsPerView) % props.aromaList.length;
    setRefinedItemOffset(newOffset);
  };
  return (
    <>
      <div ref={scrollToRef} className="liquor-card-wrapper">
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
