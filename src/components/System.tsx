import React, { useState, useEffect } from "react";
import { DataProps, HierarchyComponent } from "../types/data";
import { createHierarchy } from "../utils/dataLoader";
import Tree from "react-d3-tree";

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
  const [treeData, setTreeData] = useState<TreeNode | null>(null);

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

  if (!treeData) {
    return <div>Loading tree...</div>;
  }

  const renderCustomNode = ({ nodeDatum }: { nodeDatum: TreeNode }) => {
    return (
      <g>
        {/* Rectangle for the Component */}
        <rect
          x={
            -(nodeDatum.hasStates && nodeDatum.hasProps
              ? 100
              : nodeDatum.hasStates || nodeDatum.hasProps
              ? 60
              : 50) / 2
          }
          y={-25}
          width={
            nodeDatum.hasStates && nodeDatum.hasProps
              ? 100
              : nodeDatum.hasStates || nodeDatum.hasProps
              ? 60
              : 50
          }
          height={50}
          fill="#d9d9d9"
          stroke="none"
          rx={10}
          ry={10}
        />
        {/* Rectangle for the State */}
        {nodeDatum.hasStates && (
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
        {nodeDatum.hasProps && (
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
          y={-30}
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
    <div style={{ width: "100%", height: "800px" }}>
      <Tree
        data={treeData}
        orientation="horizontal"
        pathFunc="diagonal"
        nodeSize={{ x: 200, y: 100 }}
        translate={{ x: 300, y: 50 }}
        zoomable
        enableLegacyTransitions
        renderCustomNodeElement={renderCustomNode}
      />
    </div>
  );
};

export default System;
