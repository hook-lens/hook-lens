import { Edge, MarkerType, Node, Position } from "@xyflow/react";
import { ComponentNode } from "../module/HookExtractor";
import { isConcernedLink, calcExpandedWidth } from "./MarkUtils";

import constants from "../data/constants.json";
import edgeStyles from "../data/edgeStyles.json";

const defaultAnimationStyle = constants.defaultAnimationStyle;
const topMargin = constants.topMargin;
const innerMarkGap = constants.innerMarkGap;
const concernedEdgeWidth = constants.concernedEdgeWidth;

export function createPropNodes(component: ComponentNode) {
  return component.props.map((prop, i) => ({
    id: prop.id,
    hidden: true,
    type: "prop",
    parentId: component.id,
    className: "",
    style: { ...defaultAnimationStyle },
    data: { label: prop.name },
    position: {
      x: 0,
      y: topMargin + i * innerMarkGap,
    },
  }));
}

export function createStateNodes(component: ComponentNode) {
  const width = calcExpandedWidth(component);

  return component.states.map((state, i) => ({
    id: state.id,
    hidden: true,
    type: "state",
    parentId: component.id,
    className: "",
    style: { ...defaultAnimationStyle },
    data: { label: state.name },
    position: {
      x: width - 22,
      y: topMargin + i * innerMarkGap,
    },
  }));
}

export function createEffectNodes(component: ComponentNode) {
  return component.effects.map((effect, i) => ({
    id: effect.id,
    hidden: true,
    type: "effect",
    parentId: component.id,
    className: "",
    style: { ...defaultAnimationStyle, zIndex: 1000 },
    sourcePosition: Position.Right,
    data: {
      label: effect.id.replace("effect", "Effect").replace("_", " "),
    },
    position: {
      x: 140,
      y: topMargin + 7 + i * innerMarkGap,
    },
  }));
}

export function createEffectEdges(component: ComponentNode) {
  const edges: Edge[] = [];
  component.effects.forEach((effect) => {
    effect.dependencyIds.forEach((depId) => {
      edges.push({
        id: `${effect.id}-${depId}`,
        source: depId,
        target: effect.id,
        className: "",
        style: isConcernedLink(component, depId, effect.id)
          ? {
              ...defaultAnimationStyle,
              stroke: edgeStyles.concernedLink.color,
              strokeWidth: concernedEdgeWidth,
            }
          : {
              ...defaultAnimationStyle,
              stroke: edgeStyles.effect.color,
              strokeWidth: concernedEdgeWidth,
            },
        animated: isConcernedLink(component, depId, effect.id) ? true : false,
        zIndex: 50,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConcernedLink(component, depId, effect.id)
            ? edgeStyles.concernedLink.color
            : edgeStyles.effect.color,
        },
        data: { sourceComponent: component },
        selectable: false,
      });
    });

    effect.handlingTargetIds.forEach((targetId) => {
      edges.push({
        id: `${effect.id}-${targetId}`,
        source: effect.id,
        target: targetId,
        className: "",
        style: isConcernedLink(component, effect.id, targetId)
          ? {
              ...defaultAnimationStyle,
              stroke: edgeStyles.concernedLink.color,
              strokeWidth: concernedEdgeWidth,
            }
          : {
              ...defaultAnimationStyle,
              stroke: edgeStyles.effect.color,
              strokeWidth: concernedEdgeWidth,
            },
        animated: isConcernedLink(component, effect.id, targetId)
          ? true
          : false,
        zIndex: 50,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConcernedLink(component, effect.id, targetId)
            ? edgeStyles.concernedLink.color
            : edgeStyles.effect.color,
        },
        data: { sourceComponent: component },
        selectable: false,
      });
    });
  });
  return edges;
}

export function createPropEdges(
  componentNodes: Node[],
  propEdges: Edge[],
  stateNodes: Node[],
  propNodes: Node[]
) {
  const newPropEdges: Edge[] = [];
  componentNodes.forEach((node) => {
    if (!node.data.component) return;

    const component = node.data.component as ComponentNode;
    component.props.forEach((prop) => {
      prop.references.forEach((ref) => {
        if (ref.startsWith("setter")) {
          const nodeId = ref.replace("setter", "state");
          const target = stateNodes.find((target) => target.id === nodeId);

          if (!target) return;
          if (propEdges.find((edge) => edge.id === `${ref}-${prop.id}`)) return;

          const sourceComponent = componentNodes.find(
            (node) => node.id === target.parentId
          )?.data.component as ComponentNode;

          newPropEdges.push({
            id: `${ref}-${prop.id}`,
            source: nodeId,
            target: prop.id,
            className: "",
            style: {
              ...defaultAnimationStyle,
              stroke: edgeStyles.stateSetterProp.color,
              strokeWidth: concernedEdgeWidth,
            },
            data: {
              refRoot: target.parentId,
              propRoot: component.id,
              component: component,
              sourceComponent,
            },
            zIndex: 50,
            sourceHandle: "setter",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyles.stateSetterProp.color,
            },
            animated: true,
            selectable: false,
          });
        } else {
          const target =
            stateNodes.find((target) => target.id === ref) ||
            propNodes.find((target) => target.id === ref);

          if (!target) return;
          if (propEdges.find((edge) => edge.id === `${ref}-${prop.id}`)) return;

          const sourceComponent = componentNodes.find(
            (node) => node.id === target.parentId
          )?.data.component as ComponentNode;

          newPropEdges.push({
            id: `${ref}-${prop.id}`,
            source: ref,
            target: prop.id,
            className: "",
            style: isConcernedLink(sourceComponent, ref, prop.id)
              ? {
                  ...defaultAnimationStyle,
                  stroke: edgeStyles.concernedLink.color,
                  strokeWidth: concernedEdgeWidth,
                }
              : {
                  ...defaultAnimationStyle,
                  stroke: edgeStyles.stateValueProp.color,
                  strokeWidth: concernedEdgeWidth,
                },
            data: {
              refRoot: target.parentId,
              propRoot: component.id,
              component: component,
              sourceComponent,
            },
            zIndex: 50,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isConcernedLink(sourceComponent, ref, prop.id)
                ? edgeStyles.concernedLink.color
                : edgeStyles.stateValueProp.color,
            },
            animated: true,
            selectable: false,
          });
        }
      });
    });
  });

  return newPropEdges;
}
