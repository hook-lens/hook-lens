import { Edge, MarkerType, Node, Position } from "@xyflow/react";
import { ComponentNode } from "../module/HookExtractor";
import { isConcernedLink } from "./MarkUtils";

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
    zIndex: -100,
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
  return component.states.map((state, i) => ({
    id: state.id,
    hidden: true,
    type: "state",
    parentId: component.id,
    zIndex: -100,
    className: "",
    style: { ...defaultAnimationStyle },
    data: { label: state.name },
    position: {
      x: 300,
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
    zIndex: -100,
    className: "",
    style: { ...defaultAnimationStyle },
    sourcePosition: Position.Right,
    data: {
      label: effect.id,
    },
    position: {
      x: 125,
      y: topMargin + innerMarkGap * i,
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
        style: isConcernedLink(depId, effect.id)
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
        animated: isConcernedLink(depId, effect.id) ? true : false,
        zIndex: 50,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConcernedLink(depId, effect.id)
            ? edgeStyles.concernedLink.color
            : edgeStyles.effect.color,
        },
        data: { component: component.id },
      });
    });

    effect.handlingTargetIds.forEach((targetId) => {
      edges.push({
        id: `${effect.id}-${targetId}`,
        source: effect.id,
        target: targetId,
        className: "",
        style: isConcernedLink(effect.id, targetId)
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
        animated: isConcernedLink(effect.id, targetId) ? true : false,
        zIndex: 50,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isConcernedLink(effect.id, targetId)
            ? edgeStyles.concernedLink.color
            : edgeStyles.effect.color,
        },
        data: { component: component.id },
      });
    });
  });
  return edges;
}

export function createPropEdges(
  nodes: Node[],
  currentPropEdges: Edge[],
  currentStateNodes: Node[],
  currentPropNodes: Node[]
) {
  const newPropEdges: Edge[] = [];
  nodes.forEach((node) => {
    if (!node.data.component) return;

    const component = node.data.component as ComponentNode;
    component.props.forEach((prop) => {
      prop.references.forEach((ref) => {
        const isSetter = ref.startsWith("setter");
        if (isSetter) {
          const nodeId = ref.replace("setter", "state");
          const target = currentStateNodes.find(
            (target) => target.id === nodeId
          );

          if (!target) return;
          if (currentPropEdges.find((edge) => edge.id === `${ref}-${prop.id}`))
            return;

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
            },
            zIndex: 50,
            sourceHandle: "setter",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyles.stateSetterProp.color,
            },
            animated: true,
          });
        } else {
          const target =
            currentStateNodes.find((target) => target.id === ref) ||
            currentPropNodes.find((target) => target.id === ref);

          if (!target) return;
          if (currentPropEdges.find((edge) => edge.id === `${ref}-${prop.id}`))
            return;

          newPropEdges.push({
            id: `${ref}-${prop.id}`,
            source: ref,
            target: prop.id,
            className: "",
            style: isConcernedLink(ref, prop.id)
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
            },
            zIndex: 50,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isConcernedLink(ref, prop.id)
                ? edgeStyles.concernedLink.color
                : edgeStyles.stateValueProp.color,
            },
            animated: true,
          });
        }
      });
    });
  });

  return newPropEdges;
}
