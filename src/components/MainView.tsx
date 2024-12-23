import React, {
  useEffect,
  useRef,
  MutableRefObject,
  useCallback,
  useState,
} from "react";
import {
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useUpdateNodeInternals,
  XYPosition,
} from "@xyflow/react";
import HookExtractor, { ComponentNode } from "../module/HookExtractor";

import "@xyflow/react/dist/style.css";
import ComponentMark from "./marks/ComponentMark";
import ExpandedComponentMark from "./marks/ExpandedComponentMark";
import EffectMark from "./marks/EffectMark";
import PropMark from "./marks/PropMark";
import StateMark from "./marks/StateMark";
import NodeLegendItem from "./NodeLegendItem";
import EdgeLegendItem from "./EdgeLegendItem";

import "./MainView.css";

export interface MainViewProps {
  hookExtractor: MutableRefObject<HookExtractor>;
}

interface MarkSize {
  width: number;
  height: number;
}

const nodeTypes = {
  component: ComponentMark,
  expanded: ExpandedComponentMark,
  effect: EffectMark,
  prop: PropMark,
  state: StateMark,
};

const topMargin = 25;
const baseWidth = 25;
const baseExpadnedWidth = 325;
const innerMarkGap = 45;
const innerEdgeWidth = 1.5;

const defaultAnimationStyle = {
  transition: `width 100ms, height 100ms, transform 100ms, opacity 100ms`,
};

const markStyles = {
  component: {
    label: "Component",
    color: "#D9D9D9",
  },
  prop: {
    label: "Prop",
    color: "#A2845E",
  },
  state: {
    label: "State / Setter",
    color: "#34C759",
  },
  effect: {
    label: "Effect",
    color: "#32ADE6",
  },
};

const edgeStyles = {
  component: {
    label: "Component link",
    color: "#b1b1b7",
    style: "solid",
  },
  effect: {
    label: "Effect link",
    color: "#32ADE6",
    style: "solid",
  },
  stateValueProp: {
    label: "State value - Prop link",
    color: "#34C759",
    style: "dashed",
  },
  stateSetterProp: {
    label: "State setter - Prop link",
    color: "#A2845E",
    style: "dashed",
  },
  concernedLink: {
    label: "Concerned link",
    color: "#FF3B30",
    style: "dashed",
  },
};

function findRootComponents(
  components: ComponentNode[],
  extractor: HookExtractor
): ComponentNode[] {
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

function calcNewPosition(node: Node) {
  const initialPosition = node.data.initialPosition as XYPosition;
  const translatedPosition = node.data.translatedPosition as XYPosition;
  return {
    x: initialPosition.x + translatedPosition.x,
    y: initialPosition.y + translatedPosition.y,
  };
}

function createPropNodes(component: ComponentNode) {
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

function createStateNodes(component: ComponentNode) {
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

function createEffectNodes(component: ComponentNode) {
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

function createEffectEdges(component: ComponentNode) {
  const edges: Edge[] = [];
  component.effects.forEach((effect) => {
    effect.dependencyIds.forEach((depId) => {
      edges.push({
        id: `${effect.id}-${depId}`,
        source: depId,
        target: effect.id,
        className: "",
        style: depId.startsWith("state")
          ? {
              stroke: edgeStyles.concernedLink.color,
              strokeWidth: innerEdgeWidth,
            }
          : { stroke: edgeStyles.effect.color },
        animated: depId.startsWith("state") ? true : false,
        zIndex: 50,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: depId.startsWith("state")
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
        style: targetId.startsWith("prop")
          ? {
              stroke: edgeStyles.concernedLink.color,
              strokeWidth: innerEdgeWidth,
            }
          : { stroke: edgeStyles.effect.color },
        animated: targetId.startsWith("prop") ? true : false,
        zIndex: 50,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: targetId.startsWith("prop")
            ? edgeStyles.concernedLink.color
            : edgeStyles.effect.color,
        },
        data: { component: component.id },
      });
    });
  });
  return edges;
}

function createPropEdges(
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
            style: { stroke: edgeStyles.stateSetterProp.color },
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
            style: ref.startsWith("prop")
              ? {
                  stroke: edgeStyles.concernedLink.color,
                  strokeWidth: innerEdgeWidth,
                }
              : { stroke: edgeStyles.stateValueProp.color },
            data: {
              refRoot: target.parentId,
              propRoot: component.id,
            },
            zIndex: 50,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: ref.startsWith("prop")
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

function expandComponentNode(
  targetNode: Node,
  componentNodes: Node[],
  expandedLevels: Record<number, number>,
  isHighlightMode?: boolean
) {
  const component = targetNode.data.component as ComponentNode;
  const expandedHeight = Math.max(
    Math.max(
      component.props.length,
      component.effects.length,
      component.states.length
    ) *
      innerMarkGap +
      20,
    baseWidth
  );

  componentNodes.forEach((node) => {
    if (node.id === targetNode.id) {
      node.type = "expanded";
      node.data.size = {
        width: baseExpadnedWidth,
        height: expandedHeight,
      };
      node.position = calcNewPosition(node);
      return;
    }

    if (isHighlightMode) {
      node.className = "unfocused";
    }

    if (
      expandedLevels[targetNode.data.level as number] === 0 &&
      (node.data.level as number) > (targetNode.data.level as number)
    ) {
      (node.data.translatedPosition as XYPosition).x +=
        baseExpadnedWidth - baseWidth;
    }

    if (
      node.data.level === targetNode.data.level &&
      (node.data.index as number) > (targetNode.data.index as number)
    ) {
      (node.data.translatedPosition as XYPosition).y +=
        (targetNode.data.size as MarkSize).height - baseWidth;
    }

    node.position = calcNewPosition(node);
  });
}

function collapseComponentNode(
  targetNode: Node,
  componentNodes: Node[],
  expandedLevels: Record<number, number>
) {
  componentNodes.forEach((node) => {
    if (node.id === targetNode.id) {
      node.type = "component";
      node.position = calcNewPosition(node);
      return;
    }

    if (
      expandedLevels[targetNode.data.level as number] === 0 &&
      (node.data.level as number) > (targetNode.data.level as number)
    ) {
      (node.data.translatedPosition as XYPosition).x -=
        baseExpadnedWidth - baseWidth;
    }

    if (
      node.data.level === targetNode.data.level &&
      (node.data.index as number) > (targetNode.data.index as number)
    ) {
      (node.data.translatedPosition as XYPosition).y -=
        (targetNode.data.size as MarkSize).height - baseWidth;
    }

    node.position = calcNewPosition(node);
  });
}

function updateComponentEdges(
  componentEdges: Edge[],
  propEdges: Edge[],
  componentNodes: Node[]
) {
  console.info("updateComponentEdges", componentEdges, propEdges);
  componentEdges.forEach((edge) => {
    const source = edge.source;
    const target = edge.target;

    const sourceComponent = componentNodes.find((node) => node.id === source);
    const targetComponent = componentNodes.find((node) => node.id === target);
    if (!sourceComponent || !targetComponent) {
      return;
    }

    if (
      sourceComponent.type === "expanded" &&
      targetComponent.type === "expanded" &&
      propEdges.find(
        (propEdge) =>
          propEdge.data?.refRoot === source &&
          propEdge.data?.propRoot === target
      )
    ) {
      edge.hidden = true;
    } else {
      edge.hidden = false;
    }
  });
}

function collectHighlightedNodes(propNodes: Node[], stateNodes: Node[]) {
  const highlightedNodeIds: string[] = [];

  propNodes.forEach((n) => {
    if (n.className?.split(" ").includes("focused")) {
      highlightedNodeIds.push(n.id);
    }
  });

  stateNodes.forEach((n) => {
    if (n.className?.split(" ").includes("focused")) {
      highlightedNodeIds.push(n.id);
    }
  });

  return highlightedNodeIds;
}

function updateHighlightedMarks(
  highlightedNodeIds: string[],
  propNodes: Node[],
  stateNodes: Node[],
  effectNodes: Node[],
  propEdges: Edge[],
  effectEdges: Edge[]
) {
  const checkedNodes: (string | undefined)[] = [];
  while (highlightedNodeIds.length > 0) {
    const targetId = highlightedNodeIds.pop();
    const target =
      propNodes.find((n) => n.id === targetId) ||
      stateNodes.find((n) => n.id === targetId) ||
      effectNodes.find((n) => n.id === targetId);

    if (checkedNodes.includes(targetId) || !target) {
      continue;
    }

    target.className = "focused";
    checkedNodes.push(targetId);
    propEdges.forEach((e) => {
      if (e.source === targetId) {
        e.className = "focused";
        highlightedNodeIds.push(e.target);
      }

      if (e.target === targetId) {
        e.className = "focused";
        highlightedNodeIds.push(e.source);
      }
    });

    effectEdges.forEach((e) => {
      if (e.source === targetId) {
        e.className = "focused";
        highlightedNodeIds.push(e.target);
      }

      if (e.target === targetId) {
        e.className = "focused";
        highlightedNodeIds.push(e.source);
      }
    });
  }
}

function copyWithClassName(entities: Node[] | Edge[], className: string) {
  return entities.map((entity) => ({ ...entity, className }));
}

function setHiddenPropNodes(
  component: ComponentNode,
  propNodes: Node[],
  hidden: boolean,
  isHighlightMode?: boolean
) {
  propNodes.forEach((prop) => {
    if (prop.parentId === component.id) {
      prop.hidden = hidden;
      isHighlightMode && (prop.className = "unfocused");
    }
  });
}

function setHiddenStateNodes(
  component: ComponentNode,
  stateNodes: Node[],
  hidden: boolean,
  isHighlightMode?: boolean
) {
  stateNodes.forEach((state) => {
    if (state.parentId === component.id) {
      state.hidden = hidden;
      isHighlightMode && (state.className = "unfocused");
    }
  });
}

function setHiddenEffectNodes(
  component: ComponentNode,
  effectNodes: Node[],
  hidden: boolean,
  isHighlightMode?: boolean
) {
  effectNodes.forEach((effect) => {
    if (effect.parentId === component.id) {
      effect.hidden = hidden;
      isHighlightMode && (effect.className = "unfocused");
    }
  });
}

const MainView = ({ hookExtractor }: MainViewProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const [componentNodes, setComponentNodes] = useState<Node[]>([]);
  const [effectNodes, setEffectNodes] = useState<Node[]>([]);
  const [propNodes, setPropNodes] = useState<Node[]>([]);
  const [stateNodes, setStateNodes] = useState<Node[]>([]);

  const [componentEdges, setComponentEdges] = useState<Edge[]>([]);
  const [effectEdges, setEffectEdges] = useState<Edge[]>([]);
  const [propEdges, setPropEdges] = useState<Edge[]>([]);

  const expandedLevels = useRef<Record<number, number>>({});
  const [isHighlightMode, setHighlightMode] = useState(false);

  const extractor = hookExtractor.current;
  const components = extractor.componentList;

  const setAnyMarks = ({
    componentNodes,
    effectNodes,
    propNodes,
    stateNodes,
    componentEdges,
    effectEdges,
    propEdges,
  }: {
    componentNodes?: Node[];
    effectNodes?: Node[];
    propNodes?: Node[];
    stateNodes?: Node[];
    componentEdges?: Edge[];
    effectEdges?: Edge[];
    propEdges?: Edge[];
  }) => {
    componentNodes && setComponentNodes(componentNodes);
    effectNodes && setEffectNodes(effectNodes);
    propNodes && setPropNodes(propNodes);
    stateNodes && setStateNodes(stateNodes);
    componentEdges && setComponentEdges(componentEdges);
    effectEdges && setEffectEdges(effectEdges);
    propEdges && setPropEdges(propEdges);
  };

  useEffect(() => {
    console.info("MainView Rendered", extractor);

    const rootComponents = findRootComponents(components, extractor);
    console.log("MainView - Roots", rootComponents);

    let maxLevel = 0;
    let index = 0;
    const newNodes: Node[] = [];
    const convertComponentToMark = (node: ComponentNode, level: number) => {
      const target = newNodes.find((n) => n.id === node.id);
      if (!target) {
        newNodes.push({
          id: node.id,
          type: "component",
          style: { ...defaultAnimationStyle },
          zIndex: -100,
          data: {
            label: node.name,
            level,
            index,
            hasState: node.states.length > 0,
            hasProps: node.props.length > 0,
            component: node,
            baseWidth,
          },
          position: { x: 0, y: 0 },
        });
        index++;
      } else {
        const targetLevel = target.data.level as number;
        target.data.level = Math.max(targetLevel, level);
      }

      maxLevel = Math.max(maxLevel, level);
      node.children.sort(
        (a, b) => extractor.countDecendent(b) - extractor.countDecendent(a)
      );
      node.children.forEach((child) => {
        convertComponentToMark(child, level + 1);
      });
    };

    rootComponents.forEach((root) => {
      convertComponentToMark(root, 0);
    });

    for (let level = 0; level <= maxLevel; level++) {
      expandedLevels.current[level] = 0;
      const levelNodes = newNodes.filter((node) => node.data.level === level);
      levelNodes.forEach((node, i) => {
        const x = 10 + 200 * level;
        const y = 10 + 100 * i;
        node.position = { x, y };
        node.data.initialPosition = { x, y };
        node.data.translatedPosition = { x: 0, y: 0 };
      });
    }
    console.log("componentNodes", newNodes);

    const newEdges: Edge[] = [];
    components.forEach((component) => {
      component.children.forEach((child) => {
        newEdges.push({
          id: `${component.id}-${child.id}`,
          source: component.id,
          target: child.id,
          zIndex: 50,
          hidden: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          animated: false,
          selectable: false,
        });
      });
    });

    const newPropNodes: Node[] = [];
    const newStateNodes: Node[] = [];
    const newEffectNodes: Node[] = [];
    const newPropEdges: Edge[] = [];
    const newEffectEdges: Edge[] = [];

    components.forEach((node) => {
      newPropNodes.push(...createPropNodes(node));
      newStateNodes.push(...createStateNodes(node));
      newEffectNodes.push(...createEffectNodes(node));
      newPropEdges.push(
        ...createPropEdges(newNodes, newPropEdges, newStateNodes, newPropNodes)
      );
      newEffectEdges.push(...createEffectEdges(node));
    });

    setAnyMarks({
      componentNodes: newNodes,
      effectNodes: newEffectNodes,
      propNodes: newPropNodes,
      stateNodes: newStateNodes,
      componentEdges: newEdges,
      effectEdges: newEffectEdges,
      propEdges: newPropEdges,
    });
  }, [components, extractor]);

  const expandSingleComponent = useCallback(
    (targetNode: Node) => {
      const component = targetNode.data.component as ComponentNode;
      const updatedComponentNodes = componentNodes.map((n) => ({ ...n }));
      const updatedStateNodes = stateNodes.map((n) => ({ ...n }));
      const updatedPropNodes = propNodes.map((n) => ({ ...n }));
      const updatedEffectNodes = effectNodes.map((n) => ({ ...n }));
      const updatedCompponentEdges = componentEdges.map((e) => ({ ...e }));
      const updatedPropEdges = propEdges.map((e) => ({ ...e }));
      const updateEffectEdges = effectEdges.map((e) => ({ ...e }));

      expandComponentNode(
        targetNode,
        updatedComponentNodes,
        expandedLevels.current,
        isHighlightMode
      );
      setHiddenStateNodes(component, updatedStateNodes, false, isHighlightMode);
      setHiddenPropNodes(component, updatedPropNodes, false, isHighlightMode);
      setHiddenEffectNodes(
        component,
        updatedEffectNodes,
        false,
        isHighlightMode
      );

      const candidates = collectHighlightedNodes(
        updatedPropNodes,
        updatedStateNodes
      );

      if (candidates.length > 0) {
        updateHighlightedMarks(
          candidates,
          updatedPropNodes,
          updatedStateNodes,
          updatedEffectNodes,
          updatedPropEdges,
          updateEffectEdges
        );
      }
      updateComponentEdges(
        updatedCompponentEdges,
        updatedPropEdges,
        updatedComponentNodes
      );
      setAnyMarks({
        componentNodes: updatedComponentNodes,
        effectNodes: updatedEffectNodes,
        propNodes: updatedPropNodes,
        stateNodes: updatedStateNodes,
        componentEdges: updatedCompponentEdges,
        effectEdges: updateEffectEdges,
        propEdges: updatedPropEdges,
      });
    },
    [
      componentNodes,
      stateNodes,
      propNodes,
      effectNodes,
      propEdges,
      effectEdges,
      componentEdges,
      isHighlightMode,
    ]
  );

  const collapseSingleComponent = useCallback(
    (targetNode: Node) => {
      const component = targetNode.data.component as ComponentNode;
      const updatedComponentNodes = componentNodes.map((n) => ({ ...n }));
      const updatedPropNodes = propNodes.map((n) => ({ ...n }));
      const updatedStateNodes = stateNodes.map((n) => ({ ...n }));
      const updatedEffectNodes = effectNodes.map((n) => ({ ...n }));
      const updatedCompponentEdges = componentEdges.map((e) => ({ ...e }));

      collapseComponentNode(
        targetNode,
        updatedComponentNodes,
        expandedLevels.current
      );
      setHiddenPropNodes(component, updatedPropNodes, true);
      setHiddenStateNodes(component, updatedStateNodes, true);
      setHiddenEffectNodes(component, updatedEffectNodes, true);

      updateComponentEdges(
        updatedCompponentEdges,
        propEdges,
        updatedComponentNodes
      );
      setAnyMarks({
        componentNodes: updatedComponentNodes,
        effectNodes: updatedEffectNodes,
        propNodes: updatedPropNodes,
        stateNodes: updatedStateNodes,
        componentEdges: updatedCompponentEdges,
      });
    },
    [
      componentNodes,
      propNodes,
      stateNodes,
      effectNodes,
      componentEdges,
      propEdges,
    ]
  );

  const resetHighlight = useCallback(() => {
    const updatedComponentNodes = copyWithClassName(
      componentNodes,
      ""
    ) as Node[];
    const updatedPropNodes = copyWithClassName(propNodes, "") as Node[];
    const updatedStateNodes = copyWithClassName(stateNodes, "") as Node[];
    const updatedEffectNodes = copyWithClassName(effectNodes, "") as Node[];
    const updatedPropEdges = copyWithClassName(propEdges, "") as Edge[];
    const updatedEffectEdges = copyWithClassName(effectEdges, "") as Edge[];

    setAnyMarks({
      componentNodes: updatedComponentNodes,
      effectNodes: updatedEffectNodes,
      propNodes: updatedPropNodes,
      stateNodes: updatedStateNodes,
      effectEdges: updatedEffectEdges,
      propEdges: updatedPropEdges,
    });
    setHighlightMode(false);
  }, [
    componentNodes,
    propNodes,
    stateNodes,
    effectNodes,
    propEdges,
    effectEdges,
  ]);

  const setHighlight = useCallback(
    (node: Node) => {
      const updatedComponentNodes = copyWithClassName(
        componentNodes,
        "unfocused"
      ) as Node[];
      const updatedPropNodes = copyWithClassName(
        propNodes,
        "unfocused"
      ) as Node[];
      const updatedStateNodes = copyWithClassName(
        stateNodes,
        "unfocused"
      ) as Node[];
      const updatedEffectNodes = copyWithClassName(
        effectNodes,
        "unfocused"
      ) as Node[];
      const updatedPropEdges = copyWithClassName(
        propEdges,
        "unfocused"
      ) as Edge[];
      const updatedEffectEdges = copyWithClassName(
        effectEdges,
        "unfocused"
      ) as Edge[];

      const candidates = [node.id];
      updateHighlightedMarks(
        candidates,
        updatedPropNodes,
        updatedStateNodes,
        updatedEffectNodes,
        updatedPropEdges,
        updatedEffectEdges
      );

      setAnyMarks({
        componentNodes: updatedComponentNodes,
        effectNodes: updatedEffectNodes,
        propNodes: updatedPropNodes,
        stateNodes: updatedStateNodes,
        effectEdges: updatedEffectEdges,
        propEdges: updatedPropEdges,
      });
      setHighlightMode(true);
    },
    [componentNodes, propNodes, stateNodes, effectNodes, propEdges, effectEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === "component") {
        console.info("onNodeClick - expanding", node);
        expandSingleComponent(node);
        expandedLevels.current[node.data.level as number]++;
      } else if (node.type === "expanded") {
        console.info("onNodeClick - collapsing", node);
        expandedLevels.current[node.data.level as number]--;
        collapseSingleComponent(node);
      } else if (
        node.type === "prop" ||
        node.type === "state" ||
        node.type === "effect"
      ) {
        console.info("onNodeClick - highlighting", node);
        if (node.className?.split(" ").includes("focused")) {
          resetHighlight();
        } else {
          setHighlight(node);
        }
      }
    },
    [
      expandSingleComponent,
      collapseSingleComponent,
      resetHighlight,
      setHighlight,
    ]
  );

  const expandAllComponents = useCallback(() => {
    let updatedComponentNodes = componentNodes.map((n) => ({ ...n }));
    const updatedEffectNodes = effectNodes.map((n) => ({
      ...n,
      hidden: false,
    }));
    const updatedPropNodes = propNodes.map((n) => ({ ...n, hidden: false }));
    const updatedStateNodes = stateNodes.map((n) => ({ ...n, hidden: false }));
    const updatedComponentEdges = componentEdges.map((e) => ({ ...e }));

    componentNodes.forEach((node) => {
      if (node.type === "component") {
        expandComponentNode(
          node,
          updatedComponentNodes,
          expandedLevels.current,
          isHighlightMode
        );
        expandedLevels.current[node.data.level as number]++;
      }
    });
    updateComponentEdges(
      updatedComponentEdges,
      propEdges,
      updatedComponentNodes
    );
    setAnyMarks({
      componentNodes: updatedComponentNodes,
      effectNodes: updatedEffectNodes,
      propNodes: updatedPropNodes,
      stateNodes: updatedStateNodes,
      componentEdges: updatedComponentEdges,
    });
  }, [
    componentNodes,
    propNodes,
    stateNodes,
    effectNodes,
    componentEdges,
    propEdges,
    isHighlightMode,
  ]);

  const shrinkAllComponents = useCallback(() => {
    let updatedComponentNodes = componentNodes.map((n) => ({ ...n }));
    componentNodes.forEach((node) => {
      if (node.type === "expanded") {
        expandedLevels.current[node.data.level as number]--;
        collapseComponentNode(
          node,
          updatedComponentNodes,
          expandedLevels.current
        );
      }
    });
    const updatedEffectNodes = effectNodes.map((n) => ({
      ...n,
      hidden: true,
    }));
    const updatedPropNodes = propNodes.map((n) => ({ ...n, hidden: true }));
    const updatedStateNodes = stateNodes.map((n) => ({ ...n, hidden: true }));

    setAnyMarks({
      componentNodes: updatedComponentNodes,
      effectNodes: updatedEffectNodes,
      propNodes: updatedPropNodes,
      stateNodes: updatedStateNodes,
      componentEdges: componentEdges.map((e) => ({ ...e, hidden: false })),
    });
  }, [componentNodes, effectNodes, propNodes, stateNodes, componentEdges]);

  useEffect(() => {
    updateNodeInternals(nodes.map((n) => n.id));
  }, [nodes, updateNodeInternals]);

  useEffect(() => {
    setNodes([...componentNodes, ...effectNodes, ...propNodes, ...stateNodes]);
  }, [componentNodes, propNodes, stateNodes, effectNodes, setNodes]);

  useEffect(() => {
    setEdges([...componentEdges, ...effectEdges, ...propEdges]);
  }, [componentEdges, effectEdges, propEdges, setEdges]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        minZoom={0.5}
        maxZoom={4}
        fitView
        attributionPosition="bottom-left"
      >
        <div className="panelContainer">
          <div className="appTitle">HookLens</div>
          <MiniMap
            position="top-left"
            pannable
            style={{
              transform: "translate(0px, 50px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />

          <Panel
            position="top-left"
            style={{
              display: "flex",
              flexDirection: "column",
              transform: "translate(0px, 220px)",
            }}
          >
            <div className="legend">
              <div className="legendItemContainer">
                <div className="legendTitle">Mark</div>
                {Object.values(markStyles).map((legend) => (
                  <NodeLegendItem key={legend.label} {...legend} />
                ))}
              </div>

              <div className="legendItemContainer">
                <div className="legendTitle">Edge</div>
                {Object.values(edgeStyles).map((legend) => (
                  <EdgeLegendItem key={legend.label} {...legend} />
                ))}
              </div>
            </div>
            <button className="control" onClick={expandAllComponents}>
              Expand all
            </button>
            <button
              className="control"
              onClick={() => {
                resetHighlight();
                shrinkAllComponents();
              }}
            >
              Collapse all
            </button>
            <button className="control" onClick={resetHighlight}>
              Reset highlight
            </button>
          </Panel>
        </div>
      </ReactFlow>
    </div>
  );
};

export default MainView;
