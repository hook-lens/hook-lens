import React, { useState, useEffect, useRef } from "react";
import { DataProps, HierarchyComponent } from "../types/data";
import { createHierarchy } from "../utils/dataLoader";
import Tree from "react-d3-tree";
import * as d3 from "d3";
interface SystemProps {
  data: DataProps;
}

interface TreeNode {
  name: string;
  hasStates?: boolean;
  hasProps?: boolean;
  states?: string[];
  props?: string[];
  effect?: string[];
  children?: TreeNode[];
}

const System = ({ data }: SystemProps) => {
  console.log("System Rendered");
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const mainTreeWidth = window.innerWidth;
  const mainTreeHeight = window.innerHeight;

  const minimapScale = 0.25;
  const minimapZoom = 0.15;
  const mainTreeZoom = 3;

  const minimapWidth = mainTreeWidth * minimapScale;
  const minimapHeight = mainTreeHeight * minimapScale;

  const [mainTranslate, setMainTranslate] = useState({
    x: mainTreeWidth / 3,
    y: mainTreeHeight / 2,
  });

  const brushRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data) return;

    try {
      const hierarchy = createHierarchy(data);

      const convertToTreeData = (node: HierarchyComponent): TreeNode => ({
        name: node.name,
        hasStates: !!(node.states && node.states.length > 0),
        hasProps: !!(node.props && node.props.length > 0),
        states: node.states,
        props: node.props,
        effect: node.effects,
        children: node.children.map(convertToTreeData),
      });

      const formattedTreeData = convertToTreeData(hierarchy);
      setTreeData(formattedTreeData);
    } catch (error) {
      console.error("Error creating hierarchy", error);
    }
  }, [data]);

  useEffect(() => {
    if (!brushRef.current || !treeData) return;

    const fixedBrushSize = {
      width: 25,
      height: 25,
    };

    const brushSvg = d3.select(brushRef.current);
    brushSvg.selectAll("*").remove();

    const initialPosition: [[number, number], [number, number]] = [
      [
        minimapWidth / 3 - fixedBrushSize.width / 2,
        minimapHeight / 2 - fixedBrushSize.height / 2,
      ],
      [
        minimapWidth / 3 + fixedBrushSize.width / 2,
        minimapHeight / 2 + fixedBrushSize.height / 2,
      ],
    ];

    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [minimapWidth, minimapHeight],
      ])
      .on("brush", ({ selection }) => {
        if (selection) {
          const [[x0, y0], [x1, y1]] = selection as [
            [number, number],
            [number, number]
          ];

          const centerX = (x0 + x1) / 2 - minimapWidth / 3;
          const centerY = (y0 + y1) / 2 - minimapHeight / 2;

          const mainCenterX = centerX / minimapScale;
          const mainCenterY = centerY / minimapScale;

          const newTranslate = {
            x: mainTreeWidth / 3 - mainCenterX / minimapScale,
            y: mainTreeHeight / 2 - mainCenterY / minimapScale,
          };

          setMainTranslate(newTranslate);
        }
      });

    brushSvg
      .append("g")
      .attr("class", "brush")
      .call(brush)
      .call((g) => g.call(brush.move, initialPosition));
  }, [
    treeData,
    minimapWidth,
    minimapHeight,
    mainTreeWidth,
    mainTreeHeight,
    setMainTranslate,
  ]);

  if (!treeData) {
    return <div>Loading tree...</div>;
  }

  const renderCustomNode = ({ nodeDatum }: { nodeDatum: TreeNode }) => {
    const isSelected = selectedNode?.name === nodeDatum.name;

    const width = isSelected
      ? nodeDatum.hasStates && nodeDatum.hasProps
        ? 200
        : nodeDatum.hasStates || nodeDatum.hasProps
        ? 120
        : 100
      : nodeDatum.hasStates && nodeDatum.hasProps
      ? 100
      : nodeDatum.hasStates || nodeDatum.hasProps
      ? 60
      : 50;

    const height = isSelected ? 60 : 50;

    const handleNodeClick = () => {
      setSelectedNode(isSelected ? null : nodeDatum);
    };

    return (
      <g
        onClick={handleNodeClick}
        style={{
          cursor: "pointer",
        }}
      >
        {/* Rectangle for the Component */}
        <rect
          x={-(width / 2)}
          y={-(height / 2)}
          width={width}
          height={height}
          fill="#d9d9d9"
          stroke="none"
          rx={10}
          ry={10}
        />
        {/* Rectangle for the State */}
        {nodeDatum.hasStates && !isSelected && (
          <path
            d={
              nodeDatum.hasProps
                ? // If Props also exist, State rectangle is on the right
                  `M -0 -25
             h 40 
             q 10 0 10 10 
             v 30 
             q 0 10 -10 10 
             h -40 
             v -50 z`
                : `M -0 -25
             h 20 
             q 10 0 10 10 
             v 30 
             q 0 10 -10 10 
             h -40 
             v -50 z`
            }
            fill="#34c759"
            stroke="none"
          />
        )}
        {/* Rectangle for the Props */}
        {nodeDatum.hasProps && !isSelected && (
          <path
            d={
              nodeDatum.hasStates
                ? // If States also exist, Props rectangle is on the left
                  `M -40 -25
             q -10 0 -10 10 
             v 30 
             q 0 10 10 10 
             h 40 
             v -50 
             h -40 z`
                : `M -20 -25
             q -10 0 -10 10 
             v 30 
             q 0 10 10 10 
             h 40 
             v -50 
             h -40 z`
            }
            fill="#a2845e"
            stroke="none"
          />
        )}
        {/* Component name */}
        <text
          x={0}
          y={isSelected ? -35 : -30}
          textAnchor="middle"
          fontSize="12px"
          fontFamily="Arial, sans-serif"
          fill="black"
          stroke="none"
          fontWeight="normal"
        >
          {nodeDatum.name}
        </text>
      </g>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* Main Tree */}
      <Tree
        data={treeData}
        orientation="horizontal"
        pathFunc="diagonal"
        nodeSize={{ x: 200, y: 100 }}
        translate={mainTranslate}
        zoom={mainTreeZoom}
        zoomable={false}
        draggable={false}
        scaleExtent={{ min: mainTreeZoom, max: mainTreeZoom }}
        renderCustomNodeElement={renderCustomNode}
      />
      {/* Minimap */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          width: minimapWidth,
          height: minimapHeight,
          border: "1px solid #ccc",
          borderRadius: "5px",
          background: "#fff",
        }}
      >
        <Tree
          data={treeData}
          orientation="horizontal"
          pathFunc="diagonal"
          nodeSize={{ x: 200, y: 100 }}
          translate={{ x: minimapWidth / 3, y: minimapHeight / 2 }}
          zoom={minimapZoom}
          zoomable={false}
          draggable={false}
          scaleExtent={{ min: minimapZoom, max: minimapZoom }}
          renderCustomNodeElement={renderCustomNode}
        />
        <svg
          ref={brushRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "all",
          }}
        />
        {/* Legend */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "#fff",
            padding: "5px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "5px",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                backgroundColor: "#34c759",
                marginRight: "5px",
                borderRadius: "5px",
              }}
            ></span>
            <span>State</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                backgroundColor: "#a2845e",
                marginRight: "5px",
                borderRadius: "5px",
              }}
            ></span>
            <span>Prop</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default System;
