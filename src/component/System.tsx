import React, { useEffect } from "react";
import * as d3 from "d3";

interface SystemProps {
  data: any;
}

const System = ({ data }: SystemProps) => {
  console.log("data", data);

  return (
    <div>
      <h1>Systems</h1>
    </div>
  );
};

export default System;
