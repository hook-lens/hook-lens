import * as React from "react";
import ReactPaginate from "react-paginate";
import { useRecoilValue } from "recoil";
import { useEffect, useRef } from "react";
import { aromaListState } from "../Store/selector";
import Items from "./Items";
import "../Styles/Home.scss";
import "../Styles/Pagination.css";
import "../Styles/Reset.css";

function SegmentedItems(props) {
  const aromaList = useRecoilValue(aromaListState);
  const scrollToRef = useRef();

  const itemsPerView = props.itemsPerView;
  const viewCount = props.viewCount;
  const setViewCount = props.setViewCount;
  const activeAromaList = props.activeAromaList;
  const setActiveAromaList = props.setActiveAromaList;
  const listOffset = props.listOffset;
  const setListOffset = props.setListOffset;
  const typeFilter = props.typeFilter;

  useEffect(() => {
    const endOffset = listOffset + itemsPerView;
    setActiveAromaList(aromaList.slice(listOffset, endOffset));
    setViewCount(Math.ceil(aromaList.length / itemsPerView));
    typeFilter === "all" && scrollToRef.Active.scrollIntoView();
  }, [listOffset, itemsPerView, typeFilter]);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerView) % aromaList.length;
    setListOffset(newOffset);
  };

  return (
    <>
      <div ref={scrollToRef} className="liquor-card-wrapper">
        <Items activeItems={activeAromaList} listOffset={listOffset} />
      </div>
      <div className="footer">
        <ReactPaginate
          breakLabel="..."
          nextLabel=">"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          viewCount={viewCount}
          previousLabel="<"
          renderOnZeroPageCount={null}
          containerClassName={"pagination-ul"}
          activeClassName={"ActivePage"}
          previousClassName={"pageLabel-btn"}
          nextClassName={"pageLabel-btn"}
          onClick={() =>
            scrollToRef.Active.scrollIntoView({ behavior: "smooth" })
          }
        />
      </div>
    </>
  );
}

export default SegmentedItems;
