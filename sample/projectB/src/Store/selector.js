import { selector } from "recoil";
import * as React from "react";
import getAllAromas from "../Api/getAllAromas";
import getRate from "../Api/getRate";
import { currentAromaIdState } from "./atom";

export const aromaListState = selector({
  key: "aromaListState",
  get: async () => {
    const response = await getAllAromas();
    return response;
  },
});

export const rateListState = selector({
  key: "rateListState",
  get: async ({ get }) => {
    const aromaId = get(currentAromaIdState);
    const response = await getRate(aromaId);
    const sortedByTimeStamp = response.sort(function (a, b) {
      return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
    });
    return sortedByTimeStamp;
  },
});
