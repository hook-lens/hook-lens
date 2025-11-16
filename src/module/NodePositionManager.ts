import { ComponentNodeData, ComponentNodeProps } from "../types/NodeData";
import { isClassIncluded } from "../utils/MarkUtils";
import HookExtractor from "./HookExtractor";
import { Constants } from "../data/Constants";

export default class NodePositionManager {
  private initNodeIndex: {
    [key: string]: { level: number; index: number };
  } = {};
  private prevNodeIndex: {
    [key: string]: { level: number; index: number };
  } = {};
  private isHighlighted: boolean = false;
  private gapAmongComponents: { x: number; y: number } = {
    x: Constants.gapRangeAmongComponents.x.default,
    y: Constants.gapRangeAmongComponents.y.default,
  };

  public constructor() {}

  public initializeManager(componentNodes: ComponentNodeProps[]) {
    this.updateIndexData(componentNodes);
    componentNodes.forEach((node) => {
      this.initNodeIndex[node.id] = {
        ...node.data.indexData,
      };
    });

    this.sortComponentNodesByIndexData(componentNodes);
    this.updateNodesPosition(componentNodes);
  }

  public updateNodesPosition(componentNodes: ComponentNodeProps[]) {
    const gapX = this.gapAmongComponents.x;

    const updatedNodes: ComponentNodeProps[] = [];
    const widestNodes: { [key: number]: ComponentNodeProps } = {};

    componentNodes.forEach((node, _) => {
      const data = node.data;
      const level = data.indexData.level;

      if (widestNodes[level]) {
        const widestNodeWidth = widestNodes[level].data.size.width;
        const nodeWidth = data.size.width;

        if (nodeWidth > widestNodeWidth) {
          widestNodes[level] = node;
        }
      } else {
        widestNodes[level] = node;
      }
    });

    componentNodes.forEach((node, _) => {
      const data = node.data;
      const level = data.indexData.level;

      const widestPrevLevelNode = widestNodes[level - 1];

      let widestPrevLevelNodeWidth = 0;
      let prevLevelNodeX = 0;
      let newX = 0;

      if (widestPrevLevelNode) {
        widestPrevLevelNodeWidth = widestPrevLevelNode.data.size.width;
        prevLevelNodeX = widestPrevLevelNode.position.x;
        newX = gapX + prevLevelNodeX + widestPrevLevelNodeWidth;
      }

      const gapY = this.gapAmongComponents.y;
      const previousNode = updatedNodes[updatedNodes.length - 1];
      const newY =
        previousNode && previousNode.data.indexData.level === level
          ? gapY + previousNode.position.y + previousNode.data.size.height
          : 0;

      node.position = { x: newX, y: newY };
      updatedNodes.push(node);
    });
  }

  public resetPositions(componentNodes: ComponentNodeProps[]) {
    componentNodes.forEach((node) => {
      node.data.indexData = {
        ...this.initNodeIndex[node.id],
      };
    });

    this.sortComponentNodesByIndexData(componentNodes);
    this.updateNodesPosition(componentNodes);
  }

  public sortByComponentDegree(
    componentNodes: ComponentNodeProps[],
    extractor: HookExtractor
  ) {
    this.sortByLambdaCondition(componentNodes, (a, b) => {
      return (
        extractor.countDecendent(b.data.component) -
        extractor.countDecendent(a.data.component)
      );
    });
  }

  public sortByAscendingName(componentNodes: ComponentNodeProps[]) {
    this.sortByLambdaCondition(componentNodes, (a, b) => {
      return a.data.component.name.localeCompare(b.data.component.name);
    });
  }

  public sortByDescendingName(componentNodes: ComponentNodeProps[]) {
    this.sortByLambdaCondition(componentNodes, (a, b) => {
      return b.data.component.name.localeCompare(a.data.component.name);
    });
  }

  public sortByConcernedNode(componentNodes: ComponentNodeProps[]) {
    this.sortByLambdaCondition(componentNodes, (a, b) => {
      return a.data.isConcerned === b.data.isConcerned
        ? 0
        : a.data.isConcerned
        ? -1
        : 1;
    });
  }

  private sortByLambdaCondition(
    componentNodes: ComponentNodeProps[],
    lambda: (a: ComponentNodeProps, b: ComponentNodeProps) => number
  ) {
    componentNodes.sort((a, b) => {
      if (a.data.indexData.level === b.data.indexData.level) {
        const comparison = lambda(a, b);
        return (
          comparison ||
          this.initNodeIndex[a.id].index - this.initNodeIndex[b.id].index
        );
      }
      return a.data.indexData.level - b.data.indexData.level;
    });

    this.updateIndexData(componentNodes);
    this.updateNodesPosition(componentNodes);
  }

  public pushUpHighlightedNodes(componentNodes: ComponentNodeProps[]) {
    if (this.isHighlighted === false) {
      componentNodes.forEach((node) => {
        this.prevNodeIndex[node.id] = {
          ...(node.data as ComponentNodeData).indexData,
        };
      });

      this.isHighlighted = true;
    }

    componentNodes.sort((a, b) => {
      const aData = a.data;
      const bData = b.data;

      if (aData.indexData.level !== bData.indexData.level) {
        return aData.indexData.level - bData.indexData.level;
      }

      if (
        isClassIncluded(a.className, "focused") &&
        !isClassIncluded(b.className, "focused")
      ) {
        return -1;
      } else if (
        !isClassIncluded(a.className, "focused") &&
        isClassIncluded(b.className, "focused")
      ) {
        return 1;
      }

      return aData.indexData.index - bData.indexData.index;
    });

    this.updateIndexData(componentNodes);
    this.updateNodesPosition(componentNodes);
  }

  public revertHighlightedNodes(componentNodes: ComponentNodeProps[]) {
    if (this.isHighlighted === false) {
      return;
    }

    componentNodes.forEach((node) => {
      node.data.indexData = {
        ...this.prevNodeIndex[node.id],
      };
    });

    this.sortComponentNodesByIndexData(componentNodes);
    this.updateNodesPosition(componentNodes);
    this.isHighlighted = false;
  }

  public getNodeCenterPosition(componentNode: ComponentNodeProps) {
    const data = componentNode.data;
    const x = componentNode.position.x + data.size.width / 2;
    const y = componentNode.position.y + data.size.height / 2;

    return { x, y };
  }

  public setMarginAmongComponents(gap: { x?: number; y?: number }) {
    if (gap.x) {
      this.gapAmongComponents.x = gap.x;
    }
    if (gap.y) {
      this.gapAmongComponents.y = gap.y;
    }
  }

  public resetMarginAmongComponents() {
    this.gapAmongComponents.x = Constants.gapRangeAmongComponents.x.default;
    this.gapAmongComponents.y = Constants.gapRangeAmongComponents.y.default;
  }

  private updateIndexData(componentNodes: ComponentNodeProps[]) {
    const indices: number[] = [];
    componentNodes.forEach((node) => {
      const data = node.data;
      const level = data.indexData.level;
      const index = indices[level] || 0;
      indices[level] = index + 1;

      const indexData = {
        level,
        index,
      };

      node.data.indexData = { ...indexData };
    });
  }

  private sortComponentNodesByIndexData(componentNodes: ComponentNodeProps[]) {
    componentNodes.sort((a, b) => {
      const aIndexData = a.data.indexData;
      const bIndexData = b.data.indexData;

      if (aIndexData.level === bIndexData.level) {
        return aIndexData.index - bIndexData.index;
      }
      return aIndexData.level - bIndexData.level;
    });
  }
}
