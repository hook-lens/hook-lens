import React, { useState, useEffect, useRef, MutableRefObject } from "react";
import {
  Edge,
  MiniMap,
  Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
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

const MainView = ({ hookExtractor }: MainViewProps) => {
  const [componentNodes, setComponentNodes] = useNodesState<Node>([]);
  const [effectNodes, setEffectNodes] = useNodesState<Node>([]);
  const [propNodes, setPropNodes] = useNodesState<Node>([]);
  const [stateNodes, setStateNodes] = useNodesState<Node>([]);

  const [effectEdges, setEffectEdges] = useEdgesState<Edge>([]);

  const margin = 30;

  const extractor = hookExtractor.current;
  const components = extractor.componentList;
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
  const convertComponenttoFlowNode = (node: ComponentNode, level: number) => {
    const target = componentNodes.find((n) => n.id === node.id);
    if (!target) {
      componentNodes.push({
        id: node.id,
        type: "component",
        data: {
          label: node.name,
          level,
          hasState: node.states.length > 0,
          hasProps: node.props.length > 0,
          component: node,
          setNodes: setComponentNodes,
        },
        // style: { background: "#32ADE6", border: "none" },
        position: { x: 10, y: 10 },
      });
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
    const levelNodes = componentNodes.filter(
      (node) => node.data.level === level
    );
    levelNodes.forEach((node, i) => {
      const x = 10 + 200 * level;
      const y = 10 + 100 * i;
      node.position = { x, y };
      node.data.x = x;
      node.data.y = y;
    });
  }
  console.log("componentNodes", componentNodes);

  const componentEdges: Edge[] = [];
  components.forEach((component) => {
    component.children.forEach((child) => {
      componentEdges.push({
        id: `${component.id}-${child.id}`,
        source: component.id,
        target: child.id,
        animated: false,
      });
    });
  });

  components.forEach((component) => {
    component.falseChildren.forEach((child) => {
      componentEdges.push({
        id: `${component.id}-${child.id}`,
        source: component.id,
        target: child.id,
        animated: true,
      });
    });
  });

  useEffect(() => {
    setComponentNodes(componentNodes);
  }, []);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    console.log("onNodeClick", node);
    if (node.type !== "component" && node.type !== "expanded") return;

    const isExpanded = node.type === "component";
    node.type = isExpanded ? "expanded" : "component";
    node.zIndex = -100;

    const component = node.data.component as ComponentNode;
    setComponentNodes(componentNodes.map((n) => (n.id === node.id ? node : n)));

    if (isExpanded) {
      component.props.forEach((prop, i) => {
        propNodes.push({
          id: prop.id,
          type: "prop",
          data: { label: prop.name },
          position: {
            x: node.data.x as number,
            y: margin + (node.data.y as number) + i * 50,
          },
        });
      });
      setPropNodes(propNodes);

      component.states.forEach((state, i) => {
        stateNodes.push({
          id: state.id,
          type: "state",
          data: { label: state.name },
          position: {
            x: (node.data.x as number) + 270,
            y: margin + (node.data.y as number) + i * 50,
          },
        });
      });
      setStateNodes(stateNodes);

      component.effects.forEach((effect, i) => {
        effectNodes.push({
          id: effect.id,
          type: "effect",
          sourcePosition: Position.Right,
          data: {
            label: effect.id,
          },
          // style: { background: "#32ADE6", border: "none" },
          position: {
            x: (node.data.x as number) + 100,
            y: margin + (node.data.y as number) + 40 * i,
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

      const expandedHeight =
        Math.max(propNodes.length, effectNodes.length, stateNodes.length) * 50 +
        20;
      node.data.width = 300;
      node.data.height = expandedHeight;
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
    }
  };

  const rearrangePosition = () => {

  }

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
        edges={effectEdges.concat(componentEdges)}
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        minZoom={1}
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 3 }}
        // fitView
        attributionPosition="bottom-left"
      >
        <MiniMap position="top-left" pannable />
      </ReactFlow>
    </div>
  );
};

export default MainView;
