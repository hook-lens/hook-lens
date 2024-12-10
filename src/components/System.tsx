import React, { useState, useEffect } from "react";
import { DataProps, HierarchyComponent } from "../types/data";
import { createHierarchy } from "../utils/dataLoader";
import Tree from "react-d3-tree";

interface SystemProps {
  data: DataProps;
}

interface TreeNode {
  name: string;
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

  return (
    <div style={{ width: "100%", height: "800px" }}>
      <Tree
        data={treeData}
        orientation="horizontal"
        pathFunc="diagonal"
        nodeSize={{ x: 200, y: 200 }}
        translate={{ x: 300, y: 50 }}
        zoomable
        enableLegacyTransitions
      />
    </div>
  );
};

export default System;
