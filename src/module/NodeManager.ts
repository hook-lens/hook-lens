import { Node, Position } from "@xyflow/react";

import { calcComponentNodeSize, isConcernedLink } from "../utils/MarkUtils";
import {
  ComponentNodeProps,
  EffectNodeProps,
  PropNodeProps,
  StateNodeProps,
} from "../types/NodeData";
import { Constants } from "../data/Constants";
import { Component } from "./Component";
import HookExtractor from "./HookExtractor";

const marginTop = Constants.marginTop;
const gapAmongDetailNode = Constants.gapAmongDetailNode;

export default class NodeManager {
  private isInitialized: boolean = false;
  private componentNodes: ComponentNodeProps[] = [];
  private stateNodes: StateNodeProps[] = [];
  private propNodes: PropNodeProps[] = [];
  private effectNodes: EffectNodeProps[] = [];

  public constructor() {}

  public initializeManager(
    extractor: HookExtractor,
    openCodeView: (component: Component) => void
  ) {
    if (this.isInitialized) {
      console.info("NodeManager - Already Initialized");
      return;
    }

    const components = extractor.components;
    console.info("NodeManager - initializeManager", components);

    const rootComponents = this.findRootComponents(components, extractor);

    this.createComponentNodes(rootComponents, openCodeView);
    components.forEach((node) => {
      this.createPropNodes(node);
      this.createStateNodes(node);
      this.createEffectNodes(node);
    });

    this.checkConcernedComponentNodes();

    console.info(
      "initializeManager - Complete",
      this.componentNodes,
      this.stateNodes,
      this.propNodes,
      this.effectNodes
    );
    this.isInitialized = true;
  }

  private findRootComponents(
    components: Component[],
    extractor: HookExtractor
  ) {
    const visited: string[] = [];
    const roots: Component[] = [];

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

  private createComponentNodes(
    rootComponents: Component[],
    openCodeView: (component: Component) => void
  ) {
    const createComponentNode = ({
      node,
      level = 0,
    }: {
      node: Component;
      level: number;
    }) => {
      const target = this.componentNodes.find((n) => n.id === node.id);
      if (!target) {
        this.componentNodes.push({
          id: node.id,
          type: "component",
          style: {
            transition: "all 300ms ease",
          },
          data: {
            component: node,
            isConcerned: false,
            isHovered: false,
            indexData: {
              level,
              index: 0,
            },
            size: calcComponentNodeSize(node, "component"),
            openCodeView,
          },
          position: { x: 0, y: 0 },
        });
      } else {
        target.data.indexData.level = Math.max(
          target.data.indexData.level,
          level
        );
      }
    };

    rootComponents.forEach((root) => {
      const findCyclicNodes = (node: Component): Component[] => {
        const cyclicNodes: Component[] = [];
        const visited = new Set<string>();
        const ancestors = new Set<string>();

        const detectCycle = (current: Component) => {
          if (ancestors.has(current.id)) {
            cyclicNodes.push(current);
            return;
          }
          if (visited.has(current.id)) {
            return;
          }

          visited.add(current.id);
          ancestors.add(current.id);

          current.children.forEach((child) => detectCycle(child));

          ancestors.delete(current.id);
        };

        detectCycle(node);
        return cyclicNodes;
      };

      const cyclicNodes = findCyclicNodes(root);
      const stack = [{ node: root, level: 0 }];
      const cyclcled: string[] = [];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (cyclcled.includes(current.node.id)) {
          continue;
        }

        if (cyclicNodes.some((node) => node.id === current.node.id)) {
          cyclcled.push(current.node.id);
        }

        createComponentNode(current);
        stack.push(
          ...current.node.children.map((child) => ({
            node: child,
            level: current.level + 1,
          }))
        );
      }
    });

    this.componentNodes.sort((a, b) => {
      return a.data.indexData.level - b.data.indexData.level;
    });
  }

  private createPropNodes(component: Component) {
    const props = component.props.slice();
    props.sort((a, b) => {
      if (
        a.originState === undefined ||
        b.originState === undefined ||
        a.originState === b.originState
      ) {
        return parseInt(a.id.split("_")[1]) - parseInt(b.id.split("_")[1]);
      }

      const result =
        parseInt(a.originState.split("_")[1]) -
        parseInt(b.originState.split("_")[1]);
      if (result === 0) {
        return a.originState.startsWith("setter") ? 1 : -1;
      }
      return result;
    });

    const referencedProps = props.filter((prop) => prop.references.length > 0);
    const unreferencedProps = props.filter(
      (prop) => prop.references.length === 0
    );

    referencedProps.forEach((prop, i) => {
      this.propNodes.push({
        id: prop.id,
        hidden: true,
        type: "prop",
        parentId: component.id,
        className: "",
        style: {
          transition: "all 100ms ease",
          zIndex: 200,
        },
        data: {
          prop,
        },
        position: {
          x: 2,
          y: marginTop + i * gapAmongDetailNode,
        },
      });
    });

    unreferencedProps.forEach((prop, i) => {
      this.propNodes.push({
        id: prop.id,
        hidden: true,
        type: "prop",
        parentId: component.id,
        className: "",
        style: {
          transition: "all 100ms ease",
          zIndex: 200,
        },
        data: {
          prop,
        },
        position: {
          x: 2,
          y: marginTop + (referencedProps.length + i) * gapAmongDetailNode,
        },
      });
    });
  }

  private createStateNodes(component: Component) {
    const width = calcComponentNodeSize(component, "expanded").width;

    component.states.forEach((state, i) => {
      this.stateNodes.push({
        id: state.id,
        hidden: true,
        type: "state",
        parentId: component.id,
        className: "",
        style: {
          transition: "all 100ms ease",
          zIndex: 200,
        },
        data: {
          state,
        },
        position: {
          x: width - 26,
          y: marginTop + i * gapAmongDetailNode,
        },
      });
    });
  }

  private createEffectNodes(component: Component) {
    const hasState = component.states.length > 0;
    const hasProp = component.props.length > 0;

    let effectX = Constants.baseExpandedWidth * 0.5 - 40;
    if (!hasState && !hasProp) {
      effectX = Constants.baseExpandedWidth * 0.2 - 40;
    } else if (hasState && !hasProp) {
      effectX = 40;
    } else if (!hasState && hasProp) {
      effectX = Constants.baseExpandedWidth * 0.7 - 120;
    }

    component.effects.forEach((effect, i) => {
      this.effectNodes.push({
        id: effect.id,
        hidden: true,
        type: "effect",
        parentId: component.id,
        className: "",
        style: {
          transition: "all 100ms ease",
          zIndex: 1000,
        },
        sourcePosition: Position.Right,
        data: {
          label: effect.id.replace("effect_", "Effect "),
        },
        position: {
          x: effectX,
          y: marginTop + 7 + i * gapAmongDetailNode,
        },
      });
    });
  }

  private checkConcernedComponentNodes() {
    const concernedComponentIds: string[] = [];
    const checkConcernedNode = (node: PropNodeProps | StateNodeProps) => {
      if (!node.parentId) {
        return;
      }

      const isConcernedProp =
        node.type === "prop" && !node.data.prop.isValuableAccess;
      const isConcernedState =
        node.type === "state" &&
        ((!node.data.state.isValuableAccess &&
          !node.data.state.isValuableSetterAccess) ||
          node.data.state.accessingPositions.length === 0);

      if (isConcernedProp || isConcernedState) {
        concernedComponentIds.push(node.parentId);
      }
    };

    this.propNodes.forEach(checkConcernedNode);
    this.stateNodes.forEach(checkConcernedNode);
    this.componentNodes.forEach((node) => {
      const component = node.data.component;

      component.effects.forEach((effect) => {
        if (
          effect.dependencyIds.some((depId) =>
            isConcernedLink(component, depId, effect.id)
          ) ||
          effect.handlingTargetIds.some((targetId) =>
            isConcernedLink(component, effect.id, targetId)
          )
        ) {
          concernedComponentIds.push(node.id);
        }
      });
    });

    concernedComponentIds.forEach((id) => {
      const node = this.componentNodes.find((n) => n.id === id);
      if (node) {
        node.data.isConcerned = true;
      }
    });
  }

  public getMutableNodes() {
    this.componentNodes = this.componentNodes.map((n) => ({
      ...n,
      className: n.className?.slice(),
    }));
    this.stateNodes = this.stateNodes.map((n) => ({
      ...n,
      className: n.className?.slice(),
    }));
    this.propNodes = this.propNodes.map((n) => ({
      ...n,
      className: n.className?.slice(),
    }));
    this.effectNodes = this.effectNodes.map((n) => ({
      ...n,
      className: n.className?.slice(),
    }));

    return {
      componentNodes: this.componentNodes,
      stateNodes: this.stateNodes,
      propNodes: this.propNodes,
      effectNodes: this.effectNodes,
    };
  }

  public getMergedNodes() {
    return [
      ...this.componentNodes,
      ...this.stateNodes,
      ...this.propNodes,
      ...this.effectNodes,
    ] as Node[];
  }
}
