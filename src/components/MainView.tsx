import React, {
  useState,
  useEffect,
  useRef,
  MutableRefObject,
  useCallback,
} from "react";
import {
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  XYPosition,
} from "@xyflow/react";
import HookExtractor, {
  ComponentNode,
  StateNode,
  EffectNode,
  PropNode,
} from "../module/HookExtractor";

import "@xyflow/react/dist/style.css";
import ComponentMark from "./marks/ComponentMark";
import ExpandedComponentMark from "./marks/ExpandedComponentMark";
import EffectMark from "./marks/EffectMark";
import PropMark from "./marks/PropMark";
import StateMark from "./marks/StateMark";

type MarkSize = {
  width: number;
  height: number;
};

interface MainViewProps {
  hookExtractor: MutableRefObject<HookExtractor>;
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

function findRoots(
  components: ComponentNode[],
  extractor: HookExtractor
): ComponentNode[] {
  const visited: string[] = [];
  const roots: ComponentNode[] = [];
  components.forEach((component) => {
    if (visited.includes(component.id)) return;
    extractor.visitChildren(component, (child) => {
      visited.push(child.id);
    });
  });
  components.forEach((component) => {
    if (!visited.includes(component.id)) roots.push(component);
  });
  return roots;
}

function isConnected(
  sourceId: string,
  targetId: string,
  extractor: HookExtractor
): boolean {
  const source = extractor.getComponentById(sourceId);
  const target = extractor.getComponentById(targetId);

  if (!source || !target) return false;

  return (
    (source.getChildById(targetId) || target.getChildById(sourceId)) !==
    undefined
  );
}

function calcNewPosition(node: Node) {
  const initialPosition = node.data.initialPosition as XYPosition;
  const translatedPosition = node.data.translatedPosition as XYPosition;
  return {
    x: initialPosition.x + translatedPosition.x,
    y: initialPosition.y + translatedPosition.y,
  };
}

const MainView = ({ hookExtractor }: MainViewProps) => {
  const [componentNodes, setComponentNodes, onNodesChange] =
    useNodesState<Node>([]);
  const [effectNodes, setEffectNodes] = useNodesState<Node>([]);
  const [propNodes, setPropNodes] = useNodesState<Node>([]);
  const [stateNodes, setStateNodes] = useNodesState<Node>([]);

  const [componentEdges, setComponentEdges] = useEdgesState<Edge>([]);
  const [effectEdges, setEffectEdges] = useEdgesState<Edge>([]);
  const [propEdges, setPropEdges] = useEdgesState<Edge>([]);

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
        (a, b) => extractor.countChidren(b) - extractor.countChidren(a)
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
          markerEnd: MarkerType.Arrow,
          animated: false,
        });
      });
    });

    components.forEach((component) => {
      component.falseChildren.forEach((child) => {
        newEdges.push({
          id: `${component.id}-${child.id}`,
          source: component.id,
          target: child.id,
          markerEnd: MarkerType.Arrow,
          animated: true,
        });
      });
    });

    setComponentEdges(newEdges);
  }, [hookExtractor.current]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log("onNodeClick", node);
      if (node.type !== "component" && node.type !== "expanded") return;

      const isExpanded = node.type === "component";
      node.type = isExpanded ? "expanded" : "component";

      const component = node.data.component as ComponentNode;

      if (isExpanded) {
        component.props.forEach((prop, i) => {
          propNodes.push({
            id: prop.id,
            type: "prop",
            parentId: node.id,
            zIndex: -100,
            style: { ...defaultAnimationStyle },
            data: { label: prop.name },
            position: {
              x: 0,
              y: topMargin + i * innerMarkGap,
            },
          });
        });
        setPropNodes(propNodes);

        component.states.forEach((state, i) => {
          stateNodes.push({
            id: state.id,
            type: "state",
            parentId: node.id,
            zIndex: -100,
            style: { ...defaultAnimationStyle },
            data: { label: state.name },
            position: {
              x: 300,
              y: topMargin + i * innerMarkGap,
            },
          });
        });
        setStateNodes(stateNodes);

        component.effects.forEach((effect, i) => {
          effectNodes.push({
            id: effect.id,
            type: "effect",
            parentId: node.id,
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
          });

          effect.dependencyIds.forEach((depId) => {
            effectEdges.push({
              id: `${effect.id}-${depId}`,
              source: depId,
              target: effect.id,
              style: depId.startsWith("state")
                ? { stroke: "#FF3B30", strokeWidth: innerEdgeWidth }
                : { stroke: "black", strokeWidth: innerEdgeWidth },
              animated: depId.startsWith("state") ? true : false,
              markerStart: MarkerType.Arrow,
              data: { component: component.id },
            });
          });

          effect.handlingTargetIds.forEach((targetId) => {
            effectEdges.push({
              id: `${effect.id}-${targetId}`,
              source: effect.id,
              target: targetId,
              style: targetId.startsWith("prop")
                ? { stroke: "#FF3B30", strokeWidth: innerEdgeWidth }
                : { stroke: "black", strokeWidth: innerEdgeWidth },
              animated: targetId.startsWith("prop") ? true : false,
              data: { component: component.id },
            });
          });
        });
        setEffectNodes(effectNodes);
        setEffectEdges(effectEdges);
        console.log("effectEdges", component.effects, effectEdges);

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
        node.data.size = { width: baseExpadnedWidth, height: expandedHeight };
        const newNodes = componentNodes.map((target) => {
          if (target.id === node.id) {
            return node;
          }

          const newNode = { ...target };
          if (
            expandedLevels.current[node.data.level as number] === 0 &&
            (newNode.data.level as number) > (node.data.level as number)
          ) {
            (newNode.data.translatedPosition as XYPosition).x +=
              baseExpadnedWidth - baseWidth;
          }

          if (
            newNode.data.level === node.data.level &&
            (newNode.data.index as number) > (node.data.index as number)
          ) {
            (newNode.data.translatedPosition as XYPosition).y +=
              expandedHeight - baseWidth;
          }

          newNode.position = calcNewPosition(newNode);
          return newNode;
        });

        newNodes.forEach((node) => {
          if (node.type !== "expanded" || !node.data.component) return;

          const component = node.data.component as ComponentNode;
          component.props.forEach((prop) => {
            prop.references.forEach((ref) => {
              const target =
                stateNodes.find((target) => target.id === ref) ||
                propNodes.find((target) => target.id === ref);

              if (!target) return;
              if (propEdges.find((edge) => edge.id === `${ref}-${prop.id}`)) return;

              propEdges.push({
                id: `${ref}-${prop.id}`,
                source: ref,
                target: prop.id,
                style: { strokeWidth: innerEdgeWidth },
                data: {
                  refRoot: target.id,
                  propRoot: component.id,
                },
                animated: true,
              });
            });
          });
        });

        setPropEdges(propEdges);

        expandedLevels.current[node.data.level as number]++;
        setComponentNodes(newNodes);
      } else {
        setEffectNodes(
          effectNodes.filter((effect) => {
            return !component.effects.find((target) => target.id === effect.id);
          })
        );

        setPropNodes(
          propNodes.filter((prop) => {
            return !component.props.find((target) => target.id === prop.id);
          })
        );

        setStateNodes(
          stateNodes.filter((state) => {
            return !component.states.find((target) => target.id === state.id);
          })
        );

        setEffectEdges(
          effectEdges.filter((edge) => {
            return edge.data?.component !== component.id;
          })
        );

        setPropEdges(
          propEdges.filter((edge) => {
            return (
              edge.data?.propRoot !== component.id &&
              edge.data?.refRoot !== component.id
            );
          })
        );

        expandedLevels.current[node.data.level as number]--;
        const newNodes = componentNodes.map((target) => {
          if (target.id === node.id) {
            return node;
          }

          const newNode = { ...target };
          if (
            expandedLevels.current[node.data.level as number] === 0 &&
            (newNode.data.level as number) > (node.data.level as number)
          ) {
            (newNode.data.translatedPosition as XYPosition).x -=
              baseExpadnedWidth - baseWidth;
          }

          if (
            newNode.data.level === node.data.level &&
            (newNode.data.index as number) > (node.data.index as number)
          ) {
            (newNode.data.translatedPosition as XYPosition).y -=
              (node.data.size as MarkSize).height - baseWidth;
          }

          newNode.position = calcNewPosition(newNode);
          return newNode;
        });
        setComponentNodes(newNodes);
      }


    },
    [componentNodes, propNodes, stateNodes, effectNodes, effectEdges]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
      }}
    >
      <ReactFlow
        nodes={componentNodes
          .concat(effectNodes)
          .concat(propNodes)
          .concat(stateNodes)}
        edges={componentEdges.concat(effectEdges).concat(propEdges)}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        minZoom={1}
        maxZoom={4}
        fitView
        attributionPosition="bottom-left"
      >
        <MiniMap position="top-left" pannable />
      </ReactFlow>
    </div>
  );
};

export default MainView;
