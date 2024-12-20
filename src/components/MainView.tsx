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
  transition: `width 100ms, height 100ms, transform 100ms`,
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

function findRoots(
  components: ComponentNode[],
  extractor: HookExtractor
): ComponentNode[] {
  const visited: string[] = [];
  const roots: ComponentNode[] = [];

  components.forEach((component) => {
    if (visited.includes(component.id)) return;
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

function convertPropNodes(component: ComponentNode) {
  return component.props.map((prop, i) => ({
    id: prop.id,
    type: "prop",
    parentId: component.id,
    zIndex: -100,
    style: { ...defaultAnimationStyle },
    data: { label: prop.name },
    position: {
      x: 0,
      y: topMargin + i * innerMarkGap,
    },
  }));
}

function convertStateNodes(component: ComponentNode) {
  return component.states.map((state, i) => ({
    id: state.id,
    type: "state",
    parentId: component.id,
    zIndex: -100,
    style: { ...defaultAnimationStyle },
    data: { label: state.name },
    position: {
      x: 300,
      y: topMargin + i * innerMarkGap,
    },
  }));
}

function convertEffectNodes(component: ComponentNode) {
  return component.effects.map((effect, i) => ({
    id: effect.id,
    type: "effect",
    parentId: component.id,
    zIndex: -100,
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

function convertEffectEdges(component: ComponentNode) {
  const edges: Edge[] = [];
  component.effects.forEach((effect) => {
    effect.dependencyIds.forEach((depId) => {
      edges.push({
        id: `${effect.id}-${depId}`,
        source: depId,
        target: effect.id,
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

function convertPropEdges(
  nodes: Node[],
  currentPropEdges: Edge[],
  currentStateNodes: Node[],
  currentPropNodes: Node[]
) {
  const newPropEdges: Edge[] = [];
  nodes.forEach((node) => {
    if (node.type !== "expanded" || !node.data.component) return;

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

function updateComponentEdges(componentEdges: Edge[], propEdges: Edge[]) {
  console.info("updateComponentEdges", componentEdges, propEdges);
  const newComponentEdges: Edge[] = [];
  componentEdges.forEach((edge) => {
    const source = edge.source;
    const target = edge.target;

    let isDetailedEdgeExist = false;
    propEdges.forEach((propEdge) => {
      if (
        propEdge.data?.refRoot === source &&
        propEdge.data?.propRoot === target
      ) {
        isDetailedEdgeExist = true;
      }
    });

    if (isDetailedEdgeExist) {
      newComponentEdges.push({ ...edge, hidden: true });
    } else {
      newComponentEdges.push({ ...edge, hidden: false });
    }
  });

  return newComponentEdges;
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

  const extractor = hookExtractor.current;
  const components = extractor.componentList;

  useEffect(() => {
    console.info("MainView Rendered", extractor);

    const rootComponents = findRoots(components, extractor);
    console.log(rootComponents);

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
    setComponentNodes(newNodes);

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

    // components.forEach((component) => {
    //   component.falseChildren.forEach((child) => {
    //     newEdges.push({
    //       id: `${component.id}-${child.id}`,
    //       source: component.id,
    //       target: child.id,
    //       zIndex: 50,
    //       markerEnd: {
    //         type: MarkerType.ArrowClosed,
    //       },
    //       animated: true,
    //     });
    //   });
    // });

    setComponentEdges(newEdges);
  }, [components, extractor]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.info("onNodeClick", node);
      if (node.type !== "component" && node.type !== "expanded") return;

      let updatedNodes = componentNodes.map((n) => ({ ...n }));
      const component = node.data.component as ComponentNode;
      if (node.type === "component") {
        updatedNodes = expandComponent(node, updatedNodes);
        setComponentNodes(updatedNodes);

        const updatedPropNodes = [...propNodes, ...convertPropNodes(component)];
        setPropNodes(updatedPropNodes);

        const updatedStateNodes = [
          ...stateNodes,
          ...convertStateNodes(component),
        ];
        setStateNodes(updatedStateNodes);

        setEffectNodes([...effectNodes, ...convertEffectNodes(component)]);
        setEffectEdges([...effectEdges, ...convertEffectEdges(component)]);
        const updatedPropEdges = [
          ...propEdges,
          ...convertPropEdges(
            updatedNodes,
            propEdges,
            updatedStateNodes,
            updatedPropNodes
          ),
        ];
        setPropEdges(updatedPropEdges);
        setComponentEdges(
          updateComponentEdges(componentEdges, updatedPropEdges)
        );
        expandedLevels.current[node.data.level as number]++;
      } else {
        expandedLevels.current[node.data.level as number]--;
        const updatedPropEdges = removePropEdges(component, propEdges);
        setPropEdges(updatedPropEdges);
        setEffectEdges([...removeEffectEdges(component, effectEdges)]);
        setPropNodes([...removePropNodes(component, propNodes)]);
        setStateNodes([...removeStateNodes(component, stateNodes)]);
        setEffectNodes([...removeEffectNodes(component, effectNodes)]);

        setComponentNodes(shrinkComponent(node, updatedNodes));
        setComponentEdges(
          updateComponentEdges(componentEdges, updatedPropEdges)
        );
      }
    },
    [
      componentNodes,
      propNodes,
      stateNodes,
      effectNodes,
      componentEdges,
      effectEdges,
      propEdges,
    ]
  );

  const expandComponent = (targetNode: Node, currentNodes: Node[]) => {
    targetNode.type = "expanded";

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
    targetNode.data.size = {
      width: baseExpadnedWidth,
      height: expandedHeight,
    };

    const updatedNodes = currentNodes.map((node) => {
      if (node.id === targetNode.id) {
        return { ...targetNode, position: calcNewPosition(targetNode) };
      }

      const updateNode = { ...node };
      if (
        expandedLevels.current[targetNode.data.level as number] === 0 &&
        (updateNode.data.level as number) > (targetNode.data.level as number)
      ) {
        (updateNode.data.translatedPosition as XYPosition).x +=
          baseExpadnedWidth - baseWidth;
      }

      if (
        updateNode.data.level === targetNode.data.level &&
        (updateNode.data.index as number) > (targetNode.data.index as number)
      ) {
        (updateNode.data.translatedPosition as XYPosition).y +=
          (targetNode.data.size as MarkSize).height - baseWidth;
      }

      updateNode.position = calcNewPosition(updateNode);
      return updateNode;
    });

    return updatedNodes;
  };

  const shrinkComponent = (targetNode: Node, currentNodes: Node[]) => {
    targetNode.type = "component";
    const updatedNodes = currentNodes.map((node) => {
      if (node.id === targetNode.id) {
        return { ...targetNode, position: calcNewPosition(targetNode) };
      }

      const newNode = { ...node };
      if (
        expandedLevels.current[targetNode.data.level as number] === 0 &&
        (newNode.data.level as number) > (targetNode.data.level as number)
      ) {
        (newNode.data.translatedPosition as XYPosition).x -=
          baseExpadnedWidth - baseWidth;
      }

      if (
        newNode.data.level === targetNode.data.level &&
        (newNode.data.index as number) > (targetNode.data.index as number)
      ) {
        (newNode.data.translatedPosition as XYPosition).y -=
          (targetNode.data.size as MarkSize).height - baseWidth;
      }

      newNode.position = calcNewPosition(newNode);
      return newNode;
    });
    return updatedNodes;
  };

  const removeEffectNodes = (
    component: ComponentNode,
    currentEffectNodes: Node[]
  ) => {
    const updateEffectNodes: Node[] = [];
    currentEffectNodes.forEach((effect) => {
      if (!component.effects.find((target) => target.id === effect.id)) {
        updateEffectNodes.push({ ...effect });
      }
    });
    return updateEffectNodes;
  };

  const removePropNodes = (
    component: ComponentNode,
    currentPropNodes: Node[]
  ) => {
    const updatePropNodes: Node[] = [];
    currentPropNodes.forEach((n) => {
      if (!component.props.find((target) => target.id === n.id)) {
        updatePropNodes.push({ ...n });
      }
    });
    return updatePropNodes;
  };

  const removeStateNodes = (
    component: ComponentNode,
    currentStateNodes: Node[]
  ) => {
    const updateStateNodes: Node[] = [];
    currentStateNodes.forEach((state) => {
      if (!component.states.find((target) => target.id === state.id)) {
        updateStateNodes.push({ ...state });
      }
    });
    return updateStateNodes;
  };

  const removeEffectEdges = (
    component: ComponentNode,
    currentEffectEdges: Edge[]
  ) => {
    const updatedEffectEdges: Edge[] = [];
    currentEffectEdges.forEach((edge) => {
      if (edge.data?.component !== component.id) {
        updatedEffectEdges.push({ ...edge });
      }
    });
    return updatedEffectEdges;
  };

  const removePropEdges = (
    component: ComponentNode,
    currentPropEdges: Edge[]
  ) => {
    const updatedPropEdges: Edge[] = [];
    currentPropEdges.forEach((edge) => {
      if (
        edge.data?.propRoot !== component.id &&
        edge.data?.refRoot !== component.id
      ) {
        updatedPropEdges.push({ ...edge });
      }
    });
    return updatedPropEdges;
  };

  const expandAllComponents = useCallback(() => {
    let updatedComponentNodes = componentNodes.map((n) => ({ ...n }));
    const updatedPropNodes = propNodes.map((n) => ({ ...n }));
    const updatedStateNodes = stateNodes.map((n) => ({ ...n }));
    const updatedEffectNodes = effectNodes.map((n) => ({ ...n }));
    const updatedEffectEdges = effectEdges.map((e) => ({ ...e }));
    const updatedPropEdges = propEdges.map((e) => ({ ...e }));

    componentNodes.forEach((node) => {
      if (node.type === "component") {
        const component = node.data.component as ComponentNode;
        updatedComponentNodes = expandComponent(node, updatedComponentNodes);
        updatedPropNodes.push(...convertPropNodes(component));
        updatedStateNodes.push(...convertStateNodes(component));
        updatedEffectNodes.push(...convertEffectNodes(component));
        updatedEffectEdges.push(...convertEffectEdges(component));

        updatedPropEdges.push(
          ...convertPropEdges(
            updatedComponentNodes,
            updatedPropEdges,
            updatedStateNodes,
            updatedPropNodes
          )
        );
        expandedLevels.current[node.data.level as number]++;
      }
    });

    setComponentNodes(updatedComponentNodes);
    setPropNodes(updatedPropNodes);
    setStateNodes(updatedStateNodes);
    setEffectNodes(updatedEffectNodes);
    setEffectEdges(updatedEffectEdges);
    console.log("updatedPropEdges", updatedPropEdges);
    setPropEdges(updatedPropEdges);
    setComponentEdges(updateComponentEdges(componentEdges, updatedPropEdges));
  }, [
    componentNodes,
    propNodes,
    stateNodes,
    effectNodes,
    componentEdges,
    effectEdges,
    propEdges,
  ]);

  const shrinkAllComponents = useCallback(() => {
    let updatedComponentNodes = componentNodes.map((n) => ({ ...n }));
    componentNodes.forEach((node) => {
      if (node.type === "expanded") {
        expandedLevels.current[node.data.level as number]--;
        updatedComponentNodes = shrinkComponent(node, updatedComponentNodes);
      }
    });
    setPropNodes([]);
    setStateNodes([]);
    setEffectNodes([]);
    setEffectEdges([]);
    setPropEdges([]);
    setComponentNodes(updatedComponentNodes);
    setComponentEdges(componentEdges.map((e) => ({ ...e, hidden: false })));
  }, [componentNodes, componentEdges]);

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
        <div
          style={{
            backgroundColor: "white",
            width: 200,
            position: "relative",
            height: "100vh",
            padding: 15,
            zIndex: 100,
            borderRight: "2px solid #e5e5e5",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: "bold",
              textShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            HookLens
          </div>
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <div className="legendTitle">Mark</div>
                {Object.values(markStyles).map((legend) => (
                  <NodeLegendItem key={legend.label} {...legend} />
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <div className="legendTitle">Edge</div>
                {Object.values(edgeStyles).map((legend) => (
                  <EdgeLegendItem key={legend.label} {...legend} />
                ))}
              </div>
            </div>
            <button className="control" onClick={expandAllComponents}>
              Expand all
            </button>
            <button className="control" onClick={shrinkAllComponents}>
              Shrink all
            </button>
          </Panel>
        </div>
      </ReactFlow>
    </div>
  );
};

export default MainView;
