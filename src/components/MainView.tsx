import React, {
  useEffect,
  useRef,
  RefObject,
  useCallback,
  useState,
} from "react";
import {
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";
import { FaAngleRight, FaFileCode } from "react-icons/fa6";
import "@xyflow/react/dist/style.css";

import HookExtractor from "../module/HookExtractor";
import { Component } from "../module/Component";
import NodeManager from "../module/NodeManager";
import EdgeManager from "../module/EdgeManager";
import ComponentNode from "./marks/ComponentNode";
import NodePositionManager from "../module/NodePositionManager";
import EffectNode from "./marks/EffectNode";
import PropNode from "./marks/PropNode";
import StateNode from "./marks/StateNode";
import {
  addClassName,
  calcComponentNodeSize,
  calcNewStrokeWidth,
  isClassIncluded,
  removeClassName,
} from "../utils/MarkUtils";
import LegendPanel from "./LegendPanel";
import { NodeStyle } from "./NodeLegendItem";
import { EdgeStyle } from "./EdgeLegendItem";
import Controller from "./Controller";
import FileExplore from "./FileExplore";
import {
  ComponentNodeProps,
  EffectNodeProps,
  PropNodeProps,
  StateNodeProps,
} from "../types/NodeData";
import CodeViewPanel, { CodeViewerSource } from "./CodeViewPanel";
import Tutorial from "./Tutorial";

import nodeStyles from "../data/nodeStyles.json";
import edgeStyles from "../data/edgeStyles.json";

import "./MainView.css";
import MarginControlPanel from "./MarginControlPanel";

export interface MainViewProps {
  hookExtractor: RefObject<HookExtractor>;
  resetApp: () => void;
}

interface Marks {
  componentNodes: ComponentNodeProps[];
  effectNodes: EffectNodeProps[];
  propNodes: PropNodeProps[];
  stateNodes: StateNodeProps[];
  componentEdges: Edge[];
  effectEdges: Edge[];
  propEdges: Edge[];
}

const nodeTypes = {
  component: ComponentNode,
  expanded: ComponentNode,
  effect: EffectNode,
  prop: PropNode,
  state: StateNode,
};

function expandComponentNode(
  targetNode: ComponentNodeProps,
  componentNodes: ComponentNodeProps[]
) {
  const component = targetNode.data.component;
  const targetComponent = componentNodes.find((n) => n.id === component.id);
  if (targetComponent) {
    targetComponent.type = "expanded";
    targetComponent.data.size = calcComponentNodeSize(component, "expanded");
  }
}

function collapseComponentNode(
  targetNode: ComponentNodeProps,
  componentNodes: ComponentNodeProps[]
) {
  const component = targetNode.data.component;
  const targetComponent = componentNodes.find((n) => n.id === component.id);
  if (targetComponent) {
    targetComponent.type = "component";
    targetComponent.data.size = calcComponentNodeSize(component, "component");
  }
}

function updateComponentEdges(
  componentEdges: Edge[],
  propEdges: Edge[],
  componentNodes: ComponentNodeProps[],
  isHighlightMode?: boolean
) {
  // console.info("updateComponentEdges");
  componentEdges.forEach((edge) => {
    const sourceId = edge.source;
    const targetId = edge.target;

    const sourceComponent = componentNodes.find((node) => node.id === sourceId);
    const targetComponent = componentNodes.find((node) => node.id === targetId);
    if (!sourceComponent || !targetComponent) {
      return;
    }

    const detailedComponentEdges = propEdges.filter(
      (propEdge) =>
        (propEdge.data?.sourceComponent as Component).id === sourceId &&
        (propEdge.data?.targetComponent as Component).id === targetId
    );

    if (
      sourceComponent.type === "expanded" &&
      targetComponent.type === "expanded" &&
      detailedComponentEdges.length > 0
    ) {
      edge.hidden = true;
    } else {
      edge.hidden = false;
    }

    edge.className = isHighlightMode
      ? detailedComponentEdges.some((e) =>
          isClassIncluded(e.className, "focused")
        )
        ? "focused"
        : "unfocused"
      : "";
    edge.style = {
      ...edge.style,
      strokeWidth: calcNewStrokeWidth(edge),
    };
  });
}

function collectHighlightedNodes(
  propNodes: PropNodeProps[],
  stateNodes: StateNodeProps[]
) {
  const highlightedNodeIds: string[] = [];

  const pushFocusedNode = (n: Node) => {
    if (isClassIncluded(n.className, "focused")) {
      highlightedNodeIds.push(n.id);
    }
  };

  propNodes.forEach(pushFocusedNode);
  stateNodes.forEach(pushFocusedNode);

  return highlightedNodeIds;
}

function updateHighlightedComponentNodes(
  componentNodes: ComponentNodeProps[],
  propNodes: PropNodeProps[],
  stateNodes: StateNodeProps[],
  effectNodes: EffectNodeProps[]
) {
  componentNodes.forEach((n) => {
    const childProps = propNodes.filter((p) => p.parentId === n.id);
    const childStates = stateNodes.filter((s) => s.parentId === n.id);
    const childEffects = effectNodes.filter((e) => e.parentId === n.id);

    n.className = "unfocused";
    if (
      childProps.some((p) => isClassIncluded(p.className, "focused")) ||
      childStates.some((s) => isClassIncluded(s.className, "focused")) ||
      childEffects.some((e) => isClassIncluded(e.className, "focused"))
    ) {
      n.className = "focused";
    }
  });
}

function updateHighlightedMarks(
  highlightedNodeIds: string[],
  propNodes: PropNodeProps[],
  stateNodes: StateNodeProps[],
  effectNodes: EffectNodeProps[],
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
    propEdges.concat(effectEdges).forEach((e) => {
      if (e.source === targetId) {
        e.className = "focused";
        if (e.style?.strokeWidth) {
          e.style = { ...e.style, strokeWidth: calcNewStrokeWidth(e) };
        }
        highlightedNodeIds.push(e.target);
      }

      if (e.target === targetId) {
        e.className = "focused";
        if (e.style?.strokeWidth) {
          e.style = { ...e.style, strokeWidth: calcNewStrokeWidth(e) };
        }
        highlightedNodeIds.push(e.source);
      }
    });
  }
}

function setHiddenNodes(
  component: Component,
  nodes: Node[],
  hidden: boolean,
  isHighlightMode?: boolean
) {
  nodes
    .filter((node) => node.parentId === component.id)
    .forEach((node) => {
      node.hidden = hidden;
      isHighlightMode && (node.className = "unfocused");
    });
}

function expandSingleComponent(
  targetNode: ComponentNodeProps,
  {
    componentNodes,
    stateNodes,
    propNodes,
    effectNodes,
    componentEdges,
    propEdges,
    effectEdges,
  }: Marks,
  isHighlightMode: boolean
) {
  const component = targetNode.data.component;

  expandComponentNode(targetNode, componentNodes);

  setHiddenNodes(component, propNodes, false, isHighlightMode);
  setHiddenNodes(component, stateNodes, false, isHighlightMode);
  setHiddenNodes(component, effectNodes, false, isHighlightMode);

  const candidates = collectHighlightedNodes(propNodes, stateNodes);

  if (candidates.length > 0) {
    updateHighlightedMarks(
      candidates,
      propNodes,
      stateNodes,
      effectNodes,
      propEdges,
      effectEdges
    );

    updateHighlightedComponentNodes(
      componentNodes,
      propNodes,
      stateNodes,
      effectNodes
    );
  }

  updateComponentEdges(
    componentEdges,
    propEdges,
    componentNodes,
    isHighlightMode
  );
}

const collapseSingleComponent = (
  targetNode: ComponentNodeProps,
  {
    componentNodes,
    stateNodes,
    propNodes,
    effectNodes,
    componentEdges,
    propEdges,
  }: Marks,
  isHighlightMode: boolean
) => {
  const component = targetNode.data.component;

  collapseComponentNode(targetNode, componentNodes);

  setHiddenNodes(component, propNodes, true);
  setHiddenNodes(component, stateNodes, true);
  setHiddenNodes(component, effectNodes, true);

  if (isHighlightMode) {
    updateHighlightedComponentNodes(
      componentNodes,
      propNodes,
      stateNodes,
      effectNodes
    );
  }

  updateComponentEdges(
    componentEdges,
    propEdges,
    componentNodes,
    isHighlightMode
  );
};

const resetAllHighligtedMarks = ({
  componentNodes,
  stateNodes,
  propNodes,
  effectNodes,
  componentEdges,
  propEdges,
  effectEdges,
}: Marks) => {
  componentNodes.forEach((n) => {
    n.className = "";
  });
  stateNodes.forEach((n) => {
    n.className = "";
  });
  propNodes.forEach((n) => {
    n.className = "";
  });
  effectNodes.forEach((n) => {
    n.className = "";
  });
  componentEdges.forEach((e) => {
    e.className = "";
    e.style = {
      ...e.style,
      filter: undefined,
      strokeWidth: calcNewStrokeWidth({ ...e, className: "" }),
    };
  });
  propEdges.forEach((e) => {
    e.className = "";
    e.style = {
      ...e.style,
      filter: undefined,
      strokeWidth: calcNewStrokeWidth({ ...e, className: "" }),
    };
  });
  effectEdges.forEach((e) => {
    e.className = "";
    e.style = {
      ...e.style,
      filter: undefined,
      strokeWidth: calcNewStrokeWidth({ ...e, className: "" }),
    };
  });
};

function setHighlight(
  node: Node,
  {
    componentNodes,
    stateNodes,
    propNodes,
    effectNodes,
    componentEdges,
    propEdges,
    effectEdges,
  }: Marks
) {
  componentNodes.forEach((n) => {
    n.className = "unfocused";
  });
  propNodes.forEach((n) => {
    n.className = "unfocused";
  });
  stateNodes.forEach((n) => {
    n.className = "unfocused";
  });
  effectNodes.forEach((n) => {
    n.className = "unfocused";
  });
  componentEdges.forEach((e) => {
    e.className = "unfocused";
  });
  propEdges.forEach((e) => {
    e.className = "unfocused";
    e.style = {
      ...e.style,
      strokeWidth: calcNewStrokeWidth({ ...e, className: "unfocused" }),
    };
  });
  effectEdges.forEach((e) => {
    e.className = "unfocused";
    e.style = {
      ...e.style,
      strokeWidth: calcNewStrokeWidth({ ...e, className: "unfocused" }),
    };
  });

  updateHighlightedMarks(
    [node.id],
    propNodes,
    stateNodes,
    effectNodes,
    propEdges,
    effectEdges
  );

  updateHighlightedComponentNodes(
    componentNodes,
    propNodes,
    stateNodes,
    effectNodes
  );

  updateComponentEdges(componentEdges, propEdges, componentNodes, true);
}

const MainView = ({ hookExtractor, resetApp }: MainViewProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const reactFlow = useReactFlow();

  const [isHighlightMode, setHighlightMode] = useState(false);
  const [isCodeViewOpened, setCodeViewOpened] = useState(false);
  const [codeDisplayedNode, setCodeDisplayedNode] =
    useState<ComponentNodeProps | null>(null);
  const [codeViewerSource, setCodeViewerSource] =
    useState<CodeViewerSource | null>(null);
  const [clickedNode, setClickedNode] = useState<string>("");

  const nodeManager = useRef<NodeManager>(new NodeManager());
  const edgeManager = useRef<EdgeManager>(new EdgeManager());
  const positionManager = useRef<NodePositionManager>(
    new NodePositionManager()
  );
  const horizontalSliderRef = useRef<HTMLInputElement>(null);
  const verticalSliderRef = useRef<HTMLInputElement>(null);

  const extractor = hookExtractor.current;

  const openCodeView = useCallback(
    (component: Component) => {
      const sourceCode = extractor.getSourceCode(component);
      if (!sourceCode) {
        return;
      }

      setCodeViewerSource({
        component,
        type: sourceCode.type,
        source: sourceCode.originCode,
      });
      setCodeViewOpened(true);
    },
    [extractor]
  );

  const createAllMarks = () => {
    return {
      ...nodeManager.current.getMutableNodes(),
      ...edgeManager.current.getMutableEdges(),
    };
  };

  const moveViewToClickedPosition = useCallback(
    (parent: Node, node: Node) => {
      const x =
        parent.position.x +
        node.position.x +
        200 -
        (isCodeViewOpened ? 400 : 0);
      const y = parent.position.y + node.position.y + 100;
      const zoom = reactFlow.getViewport().zoom;
      reactFlow.setCenter(x, y, {
        zoom,
        duration: 500,
      });
    },
    [reactFlow, isCodeViewOpened]
  );

  const onNodeClicked = useCallback(
    (_: React.MouseEvent, clickedNode: Node) => {
      let isChanged = false;
      const marks = createAllMarks();
      const node =
        marks.componentNodes.find((n) => n.id === clickedNode.id) ||
        marks.effectNodes.find((n) => n.id === clickedNode.id) ||
        marks.propNodes.find((n) => n.id === clickedNode.id) ||
        marks.stateNodes.find((n) => n.id === clickedNode.id);

      if (!node) {
        return;
      }

      if (node.type === "component") {
        // console.info("onNodeClick - expanding", node);
        expandSingleComponent(
          node as ComponentNodeProps,
          marks,
          isHighlightMode
        );

        setCodeDisplayedNode(node);
        setClickedNode(node.id);
        isChanged = true;
      } else if (node.type === "expanded") {
        if (isClassIncluded(node.className, "clicked")) {
          // console.info("onNodeClick - collapsing", node);
          collapseSingleComponent(
            node as ComponentNodeProps,
            marks,
            isHighlightMode
          );

          if (
            !(
              marks.effectNodes.some(
                (n) => isClassIncluded(n.className, "focused") && !n.hidden
              ) ||
              marks.propNodes.some(
                (n) => isClassIncluded(n.className, "focused") && !n.hidden
              ) ||
              marks.stateNodes.some(
                (n) => isClassIncluded(n.className, "focused") && !n.hidden
              )
            )
          ) {
            resetAllHighligtedMarks(marks);
            setHighlightMode(false);
            positionManager.current.revertHighlightedNodes(
              marks.componentNodes
            );
          }
        }

        setCodeDisplayedNode(node);
        setClickedNode(node.id);
        isChanged = true;
      } else if (node.type && ["prop", "state", "effect"].includes(node.type)) {
        // console.info("onNodeClick - highlighting", node);
        if (isClassIncluded(node.className, "focused")) {
          if (isClassIncluded(node.className, "clicked")) {
            resetAllHighligtedMarks(marks);
            setHighlightMode(false);
            setCodeViewOpened(false);
            setClickedNode("");
            positionManager.current.revertHighlightedNodes(
              marks.componentNodes
            );
          } else {
            const parent = marks.componentNodes.find(
              (n) => n.id === node.parentId
            );
            const clickedNode =
              marks.stateNodes.find((n) =>
                isClassIncluded(n.className, "clicked")
              ) ||
              marks.propNodes.find((n) =>
                isClassIncluded(n.className, "clicked")
              ) ||
              marks.effectNodes.find((n) =>
                isClassIncluded(n.className, "clicked")
              );
            clickedNode &&
              (clickedNode.className = removeClassName(clickedNode.className, [
                "clicked",
              ]));
            parent && setCodeDisplayedNode(parent);
            parent && moveViewToClickedPosition(parent, node);
            setClickedNode(node.id);
          }
        } else {
          setHighlight(node, marks);

          marks.componentNodes
            .filter(
              (n) =>
                isClassIncluded(n.className, "focused") &&
                n.type === "component"
            )
            .forEach((n) => {
              expandSingleComponent(n, marks, true);
            });

          setHighlightMode(true);
          positionManager.current.pushUpHighlightedNodes(marks.componentNodes);

          const parent = marks.componentNodes.find(
            (n) => n.id === node.parentId
          );

          parent && setCodeDisplayedNode(parent);
          parent && moveViewToClickedPosition(parent, node);
          setClickedNode(node.id);
        }
        isChanged = true;
      }

      if (isChanged) {
        node.className = addClassName(node.className, ["clicked"]);
        const detailedNodes = [
          ...marks.stateNodes,
          ...marks.propNodes,
          ...marks.effectNodes,
        ];
        detailedNodes
          .filter((n) => n.parentId === node.id)
          .forEach((n) => {
            n.className = addClassName(n.className, ["refered"]);
          });

        [
          ...marks.componentEdges,
          ...marks.propEdges,
          ...marks.effectEdges,
        ].forEach((e) => {
          if (
            e.source === node.id ||
            e.target === node.id ||
            (e.data?.sourceComponent as Component)?.id === node.id
          ) {
            e.className = addClassName(e.className, ["refered"]);
            detailedNodes
              .filter(
                (n) =>
                  n.id !== node.id && (n.id === e.source || n.id === e.target)
              )
              .forEach((n) => {
                n.className = addClassName(n.className, ["refered"]);
              });
          }
          e.style = {
            ...e.style,
            filter: isClassIncluded(e.className, "refered")
              ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
              : undefined,
            strokeWidth: calcNewStrokeWidth(e),
          };
        });
        positionManager.current.updateNodesPosition(marks.componentNodes);

        setNodes(nodeManager.current.getMergedNodes());
        setEdges(edgeManager.current.getMergedEdges());
      }
    },
    [isHighlightMode, createAllMarks]
  );

  const onExpandedAllClicked = useCallback(() => {
    const marks = createAllMarks();
    marks.effectNodes.forEach((n) => (n.hidden = false));
    marks.propNodes.forEach((n) => (n.hidden = false));
    marks.stateNodes.forEach((n) => (n.hidden = false));

    marks.componentNodes.forEach((node) => {
      if (node.type === "component") {
        expandComponentNode(node, marks.componentNodes);
      }
    });

    positionManager.current.updateNodesPosition(marks.componentNodes);

    updateComponentEdges(
      marks.componentEdges,
      marks.propEdges,
      marks.componentNodes,
      isHighlightMode
    );

    setNodes(nodeManager.current.getMergedNodes());
    setEdges(edgeManager.current.getMergedEdges());
  }, [isHighlightMode, createAllMarks]);

  const onCollapseAllClicked = useCallback(() => {
    const marks = createAllMarks();
    marks.componentNodes.forEach((node) => {
      if (node.type === "expanded") {
        collapseComponentNode(node, marks.componentNodes);
      }
    });

    positionManager.current.updateNodesPosition(marks.componentNodes);

    marks.effectNodes.forEach((n) => (n.hidden = true));
    marks.propNodes.forEach((n) => (n.hidden = true));
    marks.stateNodes.forEach((n) => (n.hidden = true));
    marks.componentEdges.forEach((e) => (e.hidden = false));

    resetAllHighligtedMarks(marks);
    setHighlightMode(false);
    setClickedNode("");
    setCodeViewOpened(false);
    positionManager.current.revertHighlightedNodes(marks.componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
    setEdges(edgeManager.current.getMergedEdges());
  }, [createAllMarks]);

  const onResetHighlightClicked = useCallback(() => {
    const marks: Marks = createAllMarks();
    resetAllHighligtedMarks(marks);
    setHighlightMode(false);
    setClickedNode("");
    setCodeViewOpened(false);
    positionManager.current.revertHighlightedNodes(marks.componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
    setEdges(edgeManager.current.getMergedEdges());
  }, [createAllMarks]);

  const onSortByDegreeClicked = useCallback(() => {
    const { componentNodes } = nodeManager.current.getMutableNodes();
    positionManager.current.sortByComponentDegree(componentNodes, extractor);

    setNodes(nodeManager.current.getMergedNodes());
  }, [positionManager.current, nodeManager.current]);

  const onSortByAscendingNameClicked = useCallback(() => {
    const { componentNodes } = nodeManager.current.getMutableNodes();
    positionManager.current.sortByAscendingName(componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
  }, [positionManager.current, nodeManager.current]);

  const onSortByDescendingNameClicked = useCallback(() => {
    const { componentNodes } = nodeManager.current.getMutableNodes();
    positionManager.current.sortByDescendingName(componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
  }, [positionManager.current, nodeManager.current]);

  const onSortByConcernedClicked = useCallback(() => {
    const { componentNodes } = nodeManager.current.getMutableNodes();
    positionManager.current.sortByConcernedNode(componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
  }, [positionManager.current, nodeManager.current]);

  const onResetSortingClicked = useCallback(() => {
    const { componentNodes } = nodeManager.current.getMutableNodes();
    positionManager.current.resetPositions(componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
  }, [positionManager.current, nodeManager.current]);

  const onFileItemHovered = useCallback(
    (components: ComponentNodeProps[]) => {
      const { componentNodes } = nodeManager.current.getMutableNodes();
      componentNodes.forEach((n) => {
        if (components.length === 0) {
          n.data.isHovered = false;
          n.className = removeClassName(n.className, ["hovered", "unhovered"]);
        } else if (components.some((c) => c.id === n.id)) {
          n.data.isHovered = true;
          n.className = addClassName(n.className, ["hovered"]);
        } else {
          n.data.isHovered = false;
          n.className = addClassName(n.className, ["unhovered"]);
        }
      });

      setNodes(nodeManager.current.getMergedNodes());
    },
    [nodeManager.current]
  );

  const onFitViewClicked = useCallback(() => {
    reactFlow.fitView({
      padding: 0.2,
      duration: 500,
    });
  }, [reactFlow]);

  const onHorizontalMarginChange = useCallback(() => {
    const value = Number(horizontalSliderRef.current?.value);
    positionManager.current.setMarginAmongComponents({ x: value });
    positionManager.current.updateNodesPosition(
      nodeManager.current.getMutableNodes().componentNodes
    );
    setNodes(nodeManager.current.getMergedNodes());
  }, [
    horizontalSliderRef.current,
    positionManager.current,
    nodeManager.current,
  ]);

  const onVerticalMarginChange = useCallback(() => {
    const value = Number(verticalSliderRef.current?.value);
    positionManager.current.setMarginAmongComponents({ y: value });
    positionManager.current.updateNodesPosition(
      nodeManager.current.getMutableNodes().componentNodes
    );
    setNodes(nodeManager.current.getMergedNodes());
  }, [verticalSliderRef.current, positionManager.current, nodeManager.current]);

  const onResetMargin = useCallback(() => {
    positionManager.current.resetMarginAmongComponents();
    positionManager.current.updateNodesPosition(
      nodeManager.current.getMutableNodes().componentNodes
    );
    setNodes(nodeManager.current.getMergedNodes());
  }, [verticalSliderRef.current, positionManager.current, nodeManager.current]);

  useEffect(() => {
    console.info("MainView Rendered", extractor);
    nodeManager.current.initializeManager(extractor, openCodeView);
    edgeManager.current.initializeManager(extractor);

    const { componentNodes } = nodeManager.current.getMutableNodes();
    positionManager.current.initializeManager(componentNodes);

    setNodes(nodeManager.current.getMergedNodes());
    setEdges(edgeManager.current.getMergedEdges());
  }, [extractor, openCodeView]);

  useEffect(() => {
    updateNodeInternals(nodes.map((n) => n.id));
  }, [nodes, updateNodeInternals]);

  useEffect(() => {
    if (!codeDisplayedNode) {
      return;
    }

    const component = codeDisplayedNode.data.component;
    const sourceCode = extractor.getSourceCode(component);

    if (!sourceCode) {
      return;
    }

    if (codeViewerSource?.component.id !== component.id) {
      setCodeViewerSource({
        component,
        type: sourceCode.type,
        source: sourceCode.originCode,
      });
    }
  }, [codeDisplayedNode, extractor]);

  useEffect(() => {
    const transformX = 600;
    const currentViewPort = reactFlow.getViewport();
    currentViewPort.x += isCodeViewOpened ? transformX : -transformX;
    reactFlow.setViewport(currentViewPort, { duration: 100 });
  }, [isCodeViewOpened, reactFlow]);

  return (
    <div className="relative w-full h-dvh">
      <ReactFlow
        className="transition-all duration-100"
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClicked}
        nodeTypes={nodeTypes}
        minZoom={0.5}
        maxZoom={4}
        style={{
          background: isHighlightMode ? "#f0f0f0" : "#fafafa",
        }}
        fitView
        attributionPosition="bottom-left"
        edgesReconnectable={false}
      >
        <MiniMap
          className="shadow-lg translate-y-10 rounded-xl"
          position="top-left"
          pannable
        />
        <div className="flex flex-row">
          <div className="bg-white w-[230px] h-screen border-r-2 border-r-gray-100 z-[100]">
            <div className="font-[Inter] font-extrabold m-3 text-3xl text-slate-800 self-center text-center select-none cursor-pointer transition-all duration-100 hover:drop-shadow-xs hover:text-slate-400" onClick={resetApp}>
              HookLens
            </div>
            <Panel
              className="flex flex-col gap-4 translate-y-52 w-[200px] "
              position="top-left"
            >
              <LegendPanel
                nodeStyles={nodeStyles as unknown as NodeStyle[]}
                edgeStyles={edgeStyles as unknown as EdgeStyle[]}
              />
              <FileExplore
                componentNodes={
                  nodeManager.current.getMutableNodes().componentNodes
                }
                onNodeClicked={onNodeClicked}
                onItemHovered={onFileItemHovered}
              />
            </Panel>
          </div>
          <Panel
            className="flex flex-col gap-4 w-[200px] items-center "
            position="top-right"
          >
            <MarginControlPanel
              horizontalSliderRef={horizontalSliderRef}
              verticalSliderRef={verticalSliderRef}
              onHorizontalChange={onHorizontalMarginChange}
              onVerticalChange={onVerticalMarginChange}
              onResetMargin={onResetMargin}
            />
          </Panel>
          <div
            className={
              "relative flex flex-col top-[42px] h-[calc(100dvh-42px)] rounded-md shadow-sm bg-gray-300 transition-all duration-200 w-[800px] z-50 overflow-hidden " +
              (isCodeViewOpened ? "" : "-translate-x-full ")
            }
          >
            <div className="flex items-center text-sm gap-2 font-[JetBrains_Mono] text-gray-700 p-2.5 font-bold">
              <FaFileCode className="size-[18px]" />
              <span>{codeViewerSource?.component.path || "Not selected"}</span>
            </div>
            <div className="overflow-auto">
              {codeViewerSource && clickedNode && (
                <CodeViewPanel
                  codeViewerSource={codeViewerSource}
                  clickedNode={clickedNode}
                />
              )}
            </div>
          </div>
          <button
            className={
              "relative top-[43px] font-[Inter] size-fit z-50 rounded-md transition-all duration-200 overflow-hidden hover:bg-gray-300 text-gray-800 p-2 font-extrabold text-sm flex flex-row items-center cursor-pointer " +
              (isCodeViewOpened
                ? "-translate-x-[86px] bg-gray-300 "
                : "-translate-x-[800px] bg-gray-100 shadow ")
            }
            onClick={() => setCodeViewOpened(!isCodeViewOpened)}
          >
            <span className="mx-1">Code</span>
            <div className="rounded-full p-1 size-fit bg-gray-100 text-gray-500 transition-all duration-100">
              <FaAngleRight
                className={
                  "transition-all duration-100 " +
                  (isCodeViewOpened ? "rotate-180 " : "")
                }
              />
            </div>
          </button>
          <Controller
            onExpandedAllClicked={onExpandedAllClicked}
            onCollapseAllClicked={onCollapseAllClicked}
            onResetHighlightClicked={onResetHighlightClicked}
            onSortByDegreeClicked={onSortByDegreeClicked}
            onSortByAscendingNameClicked={onSortByAscendingNameClicked}
            onSortByDescendingNameClicked={onSortByDescendingNameClicked}
            onSortByDefaultClicked={onResetSortingClicked}
            onSortByConcernedClicked={onSortByConcernedClicked}
            onFitViewClicked={onFitViewClicked}
          />
        </div>
      </ReactFlow>
      <Tutorial />
    </div>
  );
};

export default MainView;
