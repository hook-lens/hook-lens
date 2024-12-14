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

interface ComponentMarkData {
  label: string;
  level: number;
  index: number;
  hasState: boolean;
  hasProps: boolean;
  baseWidth?: number;
  initialPosition?: { x: number; y: number };
  translatedPosition?: { x: number; y: number };
  size?: { width: number; height: number };
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

const defaultAnimationStyle = {
  transition: `width 100ms, height 100ms, transform 100ms`,
};

const MainView = ({ hookExtractor }: MainViewProps) => {
  const [componentNodes, setComponentNodes, onNodesChange] =
    useNodesState<Node>([]);
  const [effectNodes, setEffectNodes] = useNodesState<Node>([]);
  const [propNodes, setPropNodes] = useNodesState<Node>([]);
  const [stateNodes, setStateNodes] = useNodesState<Node>([]);

  const [componentEdges, setComponentEdges] = useEdgesState<Edge>([]);
  const [effectEdges, setEffectEdges] = useEdgesState<Edge>([]);

  const expandedLevels = useRef<Record<number, number>>({});

  const extractor = hookExtractor.current;
  const components = extractor.componentList;

  useEffect(() => {
    console.info("MainView Rendered", extractor);

    const findRoots = (components: ComponentNode[]): ComponentNode[] => {
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
    };

    const rootComponents = findRoots(components);
    console.log(rootComponents);

    let maxLevel = 0;
    let index = 0;
    const newNodes: Node[] = [];
    const convertComponenttoFlowNode = (node: ComponentNode, level: number) => {
      const target = newNodes.find((n) => n.id === node.id);
      if (!target) {
        newNodes.push({
          id: node.id,
          type: "component",
          style: defaultAnimationStyle,
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
        convertComponenttoFlowNode(child, level + 1);
      });
    };

    rootComponents.forEach((root) => {
      convertComponenttoFlowNode(root, 0);
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
      node.zIndex = -100;

      const component = node.data.component as ComponentNode;

      if (isExpanded) {
        component.props.forEach((prop, i) => {
          propNodes.push({
            id: prop.id,
            type: "prop",
            parentId: node.id,
            style: defaultAnimationStyle,
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
            style: defaultAnimationStyle,
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
            style: defaultAnimationStyle,
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
                ? { stroke: "#FF3B30", strokeWidth: 2 }
                : { stroke: "black", strokeWidth: 2 },
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
                ? { stroke: "#FF3B30", strokeWidth: 2 }
                : { stroke: "black", strokeWidth: 2 },
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
        console.log(
          "Test",
          node.data.level,
          expandedLevels.current,
          expandedLevels.current[node.data.level as number]
        );
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

          const initialPosition = newNode.data.initialPosition as XYPosition;
          const translatedPosition = newNode.data
            .translatedPosition as XYPosition;
          newNode.position = {
            x: initialPosition.x + translatedPosition.x,
            y: initialPosition.y + translatedPosition.y,
          };

          return newNode;
        });

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

          const initialPosition = newNode.data.initialPosition as XYPosition;
          const translatedPosition = newNode.data
            .translatedPosition as XYPosition;
          newNode.position = {
            x: initialPosition.x + translatedPosition.x,
            y: initialPosition.y + translatedPosition.y,
          };

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
        edges={componentEdges.concat(effectEdges)}
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        // snapToGrid={true}
        minZoom={1}
        maxZoom={4}
        // defaultViewport={{ x: 800, y: 800, zoom: 2 }}
        fitView
        attributionPosition="bottom-left"
      >
        <MiniMap position="top-left" pannable />
      </ReactFlow>
    </div>
  );
};

export default MainView;
