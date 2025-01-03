import { Edge, Node, XYPosition } from "@xyflow/react";
import HookExtractor, { ComponentNode } from "../module/HookExtractor";

import constants from "../data/constants.json";

export function isConcernedLink(
  sourceComponent: ComponentNode,
  source: string,
  target: string
) {
  if (
    (source.startsWith("effect") && target.startsWith("prop")) ||
    (source.startsWith("state") && target.startsWith("effect"))
  ) {
    return true;
  }

  if (
    source.startsWith("prop") &&
    target.startsWith("prop") &&
    sourceComponent.effects.every((effect) => !effect.dependencyIds.includes(source))
  ) {
    return true;
  }

  return false;
}

export function findRootComponents(
  components: ComponentNode[],
  extractor: HookExtractor
) {
  const visited: string[] = [];
  const roots: ComponentNode[] = [];

  components.forEach((component) => {
    if (visited.includes(component.id)) {
      return;
    }

    extractor.visitDecendent(component, (child) => {
      visited.push(child.id);
    });
  });

  components.forEach((component) => {
    if (!visited.includes(component.id)) {
      roots.push(component);
    }
  });

  return roots;
}

export function calcNewPosition(node: Node) {
  const initialPosition = node.data.initialPosition as XYPosition;
  const translatedPosition = node.data.translatedPosition as XYPosition;
  return {
    x: initialPosition.x + translatedPosition.x,
    y: initialPosition.y + translatedPosition.y,
  };
}

export function calcNewStrokeWidth(edge: Edge) {
  const baseWidth = isConcernedLink(edge.data?.sourceComponent as ComponentNode, edge.source, edge.target)
    ? constants.concernedEdgeWidth
    : 1;
  return edge.className?.split(" ").includes("focused")
    ? baseWidth + constants.edgeWidthPadding
    : baseWidth;
}

export function calcExpandedHeight(component: ComponentNode) {
  return Math.max(
    Math.max(
      component.props.length,
      component.effects.length,
      component.states.length
    ) *
      constants.innerMarkGap +
      20,
    constants.baseWidth
  );
}
