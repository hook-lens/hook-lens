import { Edge } from "@xyflow/react";

import { Component } from "../module/Component";
import { Constants } from "../data/Constants";

export function isConcernedLink(
  sourceComponent: Component | undefined,
  source: string,
  target: string
) {
  // TODO: check dependency without access
  if (
    source.startsWith("effect") &&
    target.startsWith("prop") &&
    sourceComponent?.getPropById(target)?.originState.startsWith("setter")
  ) {
    return true;
  }

  if (
    source.startsWith("prop") &&
    target.startsWith("prop") &&
    !sourceComponent?.getPropById(source)?.isValuableAccess
  ) {
    return true;
  }

  return false;
}

export function calcNewStrokeWidth(edge: Edge) {
  const baseWidth = isConcernedLink(
    edge.data?.sourceComponent as Component,
    edge.source,
    edge.target
  )
    ? Constants.concernedEdgeWidth
    : 1;
  const className = edge.className?.split(" ");
  const padding =
    (className?.includes("focused") ? Constants.edgeWidthPadding : 0) +
    (className?.includes("refered") ? Constants.edgeWidthPadding : 0);
  return baseWidth + padding;
}

function calcExpandedHeight(component: Component) {
  return Math.max(
    Math.max(
      component.props.length,
      component.effects.length,
      component.states.length
    ) *
      Constants.gapAmongDetailNode +
      20,
    Constants.baseWidth
  );
}

function calcExpandedWidth(component: Component) {
  const hasProps = component.props.length > 0 ? 1 : 0;
  const hasState = component.states.length > 0 ? 1 : 0;
  const hasEffect = component.effects.length > 0 ? 1 : 0;

  const result = hasEffect + hasProps + hasState;

  switch (result) {
    case 0:
      return Constants.baseWidth + 20;
    case 1:
      return Constants.baseExpandedWidth * 0.4;
    case 2:
      return Constants.baseExpandedWidth * 0.7;
  }

  return Constants.baseExpandedWidth;
}

export function calcComponentNodeSize(component: Component, type?: string) {
  if (type === "component") {
    const baseWidth = Constants.baseWidth;
    const hasState = component.states.length > 0;
    const hasProps = component.props.length > 0;

    const width =
      hasState && hasProps
        ? baseWidth * 2
        : hasState || hasProps
        ? baseWidth + 10
        : baseWidth;
    const height = baseWidth;

    return { width, height };
  } else if (type === "expanded") {
    return {
      width: calcExpandedWidth(component),
      height: calcExpandedHeight(component),
    };
  }

  return { width: Constants.baseWidth, height: Constants.baseWidth };
}

export function isClassIncluded(className: string | undefined, target: string) {
  return className?.split(" ").includes(target) || false;
}

export function addClassName(origin: string | undefined, target: string[]) {
  return origin
    ? [...origin.split(" "), ...target].join(" ")
    : target.join(" ");
}

export function removeClassName(origin: string | undefined, target: string[]) {
  return origin
    ? origin
        .split(" ")
        .filter((className) => !target.includes(className))
        .join(" ")
    : "";
}

export function resetClassName(className: string | undefined) {
  return className
    ?.split(" ")
    .reduce((acc, cur) =>
      cur !== "clicked" && cur !== "refered" ? acc + " " + cur : acc
    );
}
