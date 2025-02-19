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
    sourceComponent.effects.every(
      (effect) => !effect.dependencyIds.includes(source)
    )
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

export function calcNewPosition(target: Node, components: Node[]) {
  const targetLevel = target.data.level as number;

  const cousins = components.filter((n) => n.data.level === targetLevel - 1);
  const maxCousinsWidth = cousins.reduce(
    (acc, cur) =>
      Math.max(
        acc,
        (cur.data.size as { width: number; height: number }).width || 0
      ),
    constants.baseWidth
  );
  const parentX = cousins.reduce((acc, cur) => cur.position.x as number, 0);
  const gapX = cousins.some((n) => n.type === "expanded") ? 80 : 170;
  const newX = cousins.length > 0 ? gapX + parentX + maxCousinsWidth : 0;

  const adjacentSibiling =
    components[components.findIndex((n) => n.id === target.id) - 1];
  const gapY = components
    .filter((n) => n.data.level === targetLevel)
    .some((n) => n.type === "expanded")
    ? 70
    : 100;
  const newY =
    adjacentSibiling && adjacentSibiling.data.level === targetLevel
      ? gapY +
        adjacentSibiling.position.y +
        (adjacentSibiling.data.size as { width: number; height: number }).height
      : 0;

  return { x: newX, y: newY };
}

export function calcNewStrokeWidth(edge: Edge) {
  const baseWidth = isConcernedLink(
    edge.data?.sourceComponent as ComponentNode,
    edge.source,
    edge.target
  )
    ? constants.concernedEdgeWidth
    : 1;
  const className = edge.className?.split(" ");
  const padding =
    (className?.includes("focused") ? constants.edgeWidthPadding : 0) +
    (className?.includes("refered") ? constants.edgeWidthPadding : 0);
  return baseWidth + padding;
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

export function calcExpandedWidth(component: ComponentNode) {
  const hasProps = component.props.length > 0 ? 1 : 0;
  const hasState = component.states.length > 0 ? 1 : 0;
  const hasEffect = component.effects.length > 0 ? 1 : 0;

  const result = hasEffect + hasProps + hasState;

  switch (result) {
    case 0:
      return constants.baseWidth;
    case 1:
      return constants.baseExpandedWidth * 0.5;
    case 2:
      return constants.baseExpandedWidth * 0.82;
  }

  return constants.baseExpandedWidth;
}
