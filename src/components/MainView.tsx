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
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
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
import {
  createEffectEdges,
  createPropEdges,
  createPropNodes,
  createStateNodes,
  createEffectNodes,
} from "../utils/MarkBuilder";
import {
  calcExpandedHeight,
  calcNewPosition,
  calcNewStrokeWidth,
  findRootComponents,
} from "../utils/MarkUtils";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { FaFileCode, FaCaretLeft } from "react-icons/fa6";

import constants from "../data/constants.json";
import nodeStyles from "../data/nodeStyles.json";
import edgeStyles from "../data/edgeStyles.json";

import "./MainView.css";

export interface MainViewProps {
  hookExtractor: MutableRefObject<HookExtractor>;
}

interface Marks {
  componentNodes: Node[];
  effectNodes: Node[];
  propNodes: Node[];
  stateNodes: Node[];
  componentEdges: Edge[];
  effectEdges: Edge[];
  propEdges: Edge[];
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

const baseWidth = constants.baseWidth;
const baseExpadnedWidth = constants.baseExpadnedWidth;
const defaultAnimationStyle = constants.defaultAnimationStyle;

function expandComponentNode(
  targetNode: Node,
  componentNodes: Node[],
  expandedLevels: Record<number, number>,
  isHighlightMode?: boolean
) {
  const component = targetNode.data.component as ComponentNode;
  const expandedHeight = calcExpandedHeight(component);

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
  componentNodes: Node[],
  isHighlightMode?: boolean
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

    const detailedComponentEdges = propEdges.filter(
      (propEdge) =>
        propEdge.data?.refRoot === source && propEdge.data?.propRoot === target
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

    if (isHighlightMode) {
      edge.className = detailedComponentEdges.some((e) =>
        e.className?.split(" ").includes("focused")
      )
        ? "focused"
        : "unfocused";
    } else {
      edge.className = "";
    }
    edge.style = {
      ...edge.style,
      strokeWidth: calcNewStrokeWidth(edge),
    };
  });
}

function collectHighlightedNodes(propNodes: Node[], stateNodes: Node[]) {
  const highlightedNodeIds: string[] = [];

  propNodes.forEach((n) => {
    if (n.className?.split(" ").includes("focused")) {
      console.log("collectHighlightedNodes", n.className);
      highlightedNodeIds.push(n.id);
    }
  });

  stateNodes.forEach((n) => {
    if (n.className?.split(" ").includes("focused")) {
      console.log("collectHighlightedNodes", n.className);
      highlightedNodeIds.push(n.id);
    }
  });

  return highlightedNodeIds;
}

function updateHighlightedComponentNodes(
  componentNodes: Node[],
  propNodes: Node[],
  stateNodes: Node[],
  effectNodes: Node[]
) {
  componentNodes.forEach((n) => {
    const childProps = propNodes.filter((p) => p.parentId === n.id);
    const childStates = stateNodes.filter((s) => s.parentId === n.id);
    const childEffects = effectNodes.filter((e) => e.parentId === n.id);

    n.className = "unfocused";
    if (
      childProps.every((p) => p.hidden) &&
      childStates.every((s) => s.hidden) &&
      childEffects.every((e) => e.hidden)
    ) {
      if (
        childProps.some((p) => p.className?.split(" ").includes("focused")) ||
        childStates.some((s) => s.className?.split(" ").includes("focused")) ||
        childEffects.some((e) => e.className?.split(" ").includes("focused"))
      ) {
        n.className = "focused";
      }
    }
  });
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

    effectEdges.forEach((e) => {
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
  component: ComponentNode,
  nodes: Node[],
  hidden: boolean,
  isHighlightMode?: boolean
) {
  nodes.forEach((node) => {
    if (node.parentId === component.id) {
      node.hidden = hidden;
      isHighlightMode && (node.className = "unfocused");
    }
  });
}

function expandSingleComponent(
  targetNode: Node,
  {
    componentNodes,
    stateNodes,
    propNodes,
    effectNodes,
    componentEdges,
    propEdges,
    effectEdges,
  }: Marks,
  expandedLevels: Record<number, number>,
  isHighlightMode: boolean
) {
  const component = targetNode.data.component as ComponentNode;

  expandComponentNode(
    targetNode,
    componentNodes,
    expandedLevels,
    isHighlightMode
  );
  setHiddenNodes(component, propNodes, false, isHighlightMode);
  setHiddenNodes(component, stateNodes, false, isHighlightMode);
  setHiddenNodes(component, effectNodes, false, isHighlightMode);

  const candidates = collectHighlightedNodes(propNodes, stateNodes);

  if (candidates.length > 0) {
    console.log("expandSingleComponent - candidates", candidates);
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
  targetNode: Node,
  {
    componentNodes,
    stateNodes,
    propNodes,
    effectNodes,
    componentEdges,
    propEdges,
  }: Marks,
  expandedLevels: Record<number, number>,
  isHighlightMode: boolean
) => {
  const component = targetNode.data.component as ComponentNode;

  collapseComponentNode(targetNode, componentNodes, expandedLevels);
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
      strokeWidth: calcNewStrokeWidth({ ...e, className: "" }),
    };
  });
  propEdges.forEach((e) => {
    e.className = "";
    e.style = {
      ...e.style,
      strokeWidth: calcNewStrokeWidth({ ...e, className: "" }),
    };
  });
  effectEdges.forEach((e) => {
    e.className = "";
    e.style = {
      ...e.style,
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

  const candidates = [node.id];
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

  updateComponentEdges(componentEdges, propEdges, componentNodes, true);
}

const MainView = ({ hookExtractor }: MainViewProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const reactFlow = useReactFlow();

  const [componentNodes, setComponentNodes] = useState<Node[]>([]);
  const [effectNodes, setEffectNodes] = useState<Node[]>([]);
  const [propNodes, setPropNodes] = useState<Node[]>([]);
  const [stateNodes, setStateNodes] = useState<Node[]>([]);

  const [componentEdges, setComponentEdges] = useState<Edge[]>([]);
  const [effectEdges, setEffectEdges] = useState<Edge[]>([]);
  const [propEdges, setPropEdges] = useState<Edge[]>([]);

  const [isHighlightMode, setHighlightMode] = useState(false);
  const [isCodeDisplayed, setCodeDisplayed] = useState(false);
  const [codeDisplayedNode, setCodeDisplayedNode] = useState<Node | null>(null);
  const [sourceCode, setSourceCode] = useState<{
    path: string;
    source: string;
  }>({ path: "Not selected", source: "" });

  const expandedLevels = useRef<Record<number, number>>({});

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

  const openCodeView = useCallback(
    (component: ComponentNode) => {
      setSourceCode({
        path: component.path,
        source: extractor.getSourceCode(component) || "",
      });
      setCodeDisplayed(true);
    },
    [extractor]
  );

  const createAllMarks = useCallback(() => {
    return {
      componentNodes: componentNodes.map((n) => ({ ...n })),
      stateNodes: stateNodes.map((n) => ({ ...n })),
      propNodes: propNodes.map((n) => ({ ...n })),
      effectNodes: effectNodes.map((n) => ({ ...n })),
      componentEdges: componentEdges.map((e) => ({ ...e })),
      propEdges: propEdges.map((e) => ({ ...e })),
      effectEdges: effectEdges.map((e) => ({ ...e })),
    };
  }, [
    componentNodes,
    stateNodes,
    propNodes,
    effectNodes,
    componentEdges,
    propEdges,
    effectEdges,
  ]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const marks = createAllMarks();
      if (node.type === "component") {
        console.info("onNodeClick - expanding", node);
        expandSingleComponent(
          node,
          marks,
          expandedLevels.current,
          isHighlightMode
        );
        expandedLevels.current[node.data.level as number]++;

        setCodeDisplayedNode(node);
      } else if (node.type === "expanded") {
        console.info("onNodeClick - collapsing", node);
        expandedLevels.current[node.data.level as number]--;
        collapseSingleComponent(
          node,
          marks,
          expandedLevels.current,
          isHighlightMode
        );

        if (
          !(
            marks.effectNodes.some(
              (n) => n.className?.split(" ").includes("focused") && !n.hidden
            ) ||
            marks.propNodes.some(
              (n) => n.className?.split(" ").includes("focused") && !n.hidden
            ) ||
            marks.stateNodes.some(
              (n) => n.className?.split(" ").includes("focused") && !n.hidden
            )
          )
        ) {
          resetAllHighligtedMarks(marks);
          setHighlightMode(false);
        }
      } else if (
        node.type === "prop" ||
        node.type === "state" ||
        node.type === "effect"
      ) {
        console.info("onNodeClick - highlighting", node);
        if (node.className?.split(" ").includes("focused")) {
          resetAllHighligtedMarks(marks);
          setHighlightMode(false);
        } else {
          setHighlight(node, marks);
          setHighlightMode(true);
          const parent = marks.componentNodes.find(
            (n) => n.id === node.parentId
          );
          parent && setCodeDisplayedNode(parent);
        }
      }

      setAnyMarks(marks);
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
        expandComponentNode(
          node,
          marks.componentNodes,
          expandedLevels.current,
          isHighlightMode
        );
        expandedLevels.current[node.data.level as number]++;
      }
    });
    updateComponentEdges(
      marks.componentEdges,
      marks.propEdges,
      marks.componentNodes,
      isHighlightMode
    );
    setAnyMarks(marks);
  }, [isHighlightMode, createAllMarks]);

  const onCollapseAllClicked = useCallback(() => {
    const marks = createAllMarks();
    marks.componentNodes.forEach((node) => {
      if (node.type === "expanded") {
        expandedLevels.current[node.data.level as number]--;
        collapseComponentNode(
          node,
          marks.componentNodes,
          expandedLevels.current
        );
      }
    });

    marks.effectNodes.forEach((n) => (n.hidden = true));
    marks.propNodes.forEach((n) => (n.hidden = true));
    marks.stateNodes.forEach((n) => (n.hidden = true));
    marks.componentEdges.forEach((e) => (e.hidden = false));

    resetAllHighligtedMarks(marks);
    setHighlightMode(false);
    setAnyMarks(marks);

    setCodeDisplayed(false);
  }, [createAllMarks]);

  const onResetHighlightClicked = useCallback(() => {
    const marks: Marks = createAllMarks();
    resetAllHighligtedMarks(marks);
    setHighlightMode(false);
    setAnyMarks(marks);
  }, [createAllMarks]);

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
          data: {
            label: node.name,
            level,
            index,
            hasState: node.states.length > 0,
            hasProps: node.props.length > 0,
            component: node,
            baseWidth,
            openCodeView,
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
  }, [components, extractor, openCodeView]);

  useEffect(() => {
    updateNodeInternals(nodes.map((n) => n.id));
  }, [nodes, updateNodeInternals]);

  useEffect(() => {
    setNodes([...componentNodes, ...effectNodes, ...propNodes, ...stateNodes]);
  }, [componentNodes, propNodes, stateNodes, effectNodes, setNodes]);

  useEffect(() => {
    setEdges([...componentEdges, ...effectEdges, ...propEdges]);
  }, [componentEdges, effectEdges, propEdges, setEdges]);

  useEffect(() => {
    if (!codeDisplayedNode) {
      return;
    }

    if (
      codeDisplayedNode.type === "component" ||
      codeDisplayedNode.type === "expanded"
    ) {
      const component = codeDisplayedNode.data.component as ComponentNode;
      setSourceCode({
        path: component.path || "Not found",
        source: extractor.getSourceCode(component) || "",
      });
    }
  }, [codeDisplayedNode, extractor]);

  useEffect(() => {
    const transformX = 600;
    const currentViewPort = reactFlow.getViewport();
    currentViewPort.x += isCodeDisplayed ? transformX : -transformX;
    reactFlow.setViewport(currentViewPort);
  }, [isCodeDisplayed, reactFlow]);

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
        <MiniMap
          position="top-left"
          pannable
          style={{
            zIndex: 150,
            transform: "translate(0px, 50px)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div className="panelContainer">
            <div className="appTitle">HookLens</div>
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
                  {Object.values(nodeStyles).map((legend) => (
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
            </Panel>
          </div>
          <div
            className={
              isCodeDisplayed ? "codeViewContainer" : "codeViewContainer hidden"
            }
          >
            <div className="codeViewPath">
              <FaFileCode
                style={{
                  width: "20px",
                  height: "20px",
                  textShadow: "0 1px 4px rgba(0, 0, 0, 0.6)",
                }}
              />
              <div>{sourceCode.path}</div>
            </div>
            <SyntaxHighlighter
              style={atomOneDark}
              language="javascript"
              showLineNumbers={true}
              customStyle={{
                fontSize: 14,
                textAlign: "left",
                margin: "0px",
                height: "100%",
              }}
            >
              {sourceCode.source}
            </SyntaxHighlighter>

            <div className="controlContainer">
              <button
                className="codeViewHandle"
                onClick={() => setCodeDisplayed(!isCodeDisplayed)}
              >
                {isCodeDisplayed ? <FaCaretLeft /> : <FaFileCode />}
              </button>
              <button className="control" onClick={onExpandedAllClicked}>
                Expand all
              </button>
              <button className="control" onClick={onCollapseAllClicked}>
                Collapse all
              </button>
              <button className="control" onClick={onResetHighlightClicked}>
                Reset highlight
              </button>
            </div>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
};

export default MainView;
