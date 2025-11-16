import { useEffect, useRef } from "react";

import ReactPaginate from "react-paginate";
import { useRecoilValue } from "recoil";
import { aromaListState } from "../Store/selector";
import Items from "./Items";

import "../Styles/Dashboard.scss";
import "../Styles/Pagination.css";
import "../Styles/Reset.css";

function SegmentedItems(props) {
  const aromaList = useRecoilValue(aromaListState);
  const scrollToRef = useRef();

  const viewCount = props.viewCount;
  const setViewCount = props.setViewCount;
  const activeAromaList = props.activeAromaList;
  const setActiveAromaList = props.setActiveAromaList;
  const listOffset = props.listOffset;
  const setListOffset = props.setListOffset;
  const itemsPerView = props.itemsPerView;
  const typeFilter = props.typeFilter;

  const onPageChanged = (event) => {
    const offset = (event.selected * itemsPerView) % aromaList.length;
    setListOffset(offset);
  };

  useEffect(() => {
    const endOffset = listOffset + itemsPerView;
    setActiveAromaList(aromaList.slice(listOffset, endOffset));
    setViewCount(Math.ceil(aromaList.length / itemsPerView));

    if (typeFilter === "all") {
      scrollToRef.Active.scrollIntoView();
    }
  }, [listOffset, itemsPerView, typeFilter]);

  return (
    <>
      <div ref={scrollToRef} className="aroma-card-wrapper">
        <Items activeItems={activeAromaList} listOffset={listOffset} />
      </div>
      <div className="footer">
        <ReactPaginate
          breakLabel="..."
          nextLabel=">"
          onPageChange={onPageChanged}
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
