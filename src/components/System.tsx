import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface SystemProps {
  data: any;
}

const System = ({ data }: SystemProps) => {
  console.log("data", data);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 800;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const root = d3.hierarchy(data);

    const treeLayout = d3.tree().size([height, width]);
    treeLayout(root);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Add links
    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", (d) => d.source.x ?? 0)
      .attr("y1", (d) => d.source.y ?? 0)
      .attr("x2", (d) => d.target.x ?? 0)
      .attr("y2", (d) => d.target.y ?? 0)
      .style("stroke", "#999");

    // Add nodes
    svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("cx", (d) => (d.x ?? 0) + 10)
      .attr("cy", (d) => d.y ?? 0)
      .attr("r", 5)
      .style("fill", "steelblue");

    // Add labels
    svg
      .selectAll(".label")
      .data(root.descendants())
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => (d.x ?? 0) + 10)
      .attr("y", (d) => d.y ?? 0)
      .text((d) => d.data.name)
      .style("font-size", "12px");
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default System;
