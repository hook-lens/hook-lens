import { Edge, MarkerType } from "@xyflow/react";

import { isConcernedLink, resetClassName } from "../utils/MarkUtils";
import { Constants } from "../data/Constants";
import { Component } from "./Component";
import { State } from "./State";
import { Prop } from "./Prop";
import HookExtractor from "./HookExtractor";
import edgeStyles from "../data/edgeStyles.json";

const concernedEdgeWidth = Constants.concernedEdgeWidth;
const concenredEdgeColor = edgeStyles.concernedLink.color;
const effectEdgeColor = edgeStyles.effect.color;
const stateValueEdgeColor = edgeStyles.stateValueProp.color;
const stateSetterEdgeColor = edgeStyles.stateSetterProp.color;

export default class EdgeManager {
  private isInitialized: boolean = false;
  private componentEdges: Edge[] = [];
  private propEdges: Edge[] = [];
  private effectEdges: Edge[] = [];

  public constructor() {}

  public initializeManager(extractor: HookExtractor) {
    if (this.isInitialized) {
      console.info("EdgeManager - Already Initialized");
      return;
    }

    const components = extractor.components;
    const states = extractor.states;
    const props = extractor.props;
    console.info("EdgeManager - initializeManager");

    this.createComponentEdges(components);
    components.forEach((node) => {
      this.createPropEdges(components, states, props);
      this.createEffectEdges(node);
    });

    this.updateConcernedComponentEdges();

    console.info(
      "initializeManager - Complete",
      this.componentEdges,
      this.propEdges,
      this.effectEdges
    );
    this.isInitialized = true;
  }

  private createComponentEdges(components: Component[]) {
    components.forEach((component) => {
      component.children.forEach((child) => {
        const id = `${component.id}-${child.id}`;
        if (this.componentEdges.find((edge) => edge.id === id)) {
          return;
        }

        this.componentEdges.push({
          id,
          source: component.id,
          target: child.id,
          zIndex: -10,
          hidden: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          data: { isConcerned: false },
          animated: false,
          selectable: false,
        });
      });
    });
  }

  private createEffectEdges(component: Component) {
    component.effects.forEach((effect) => {
      effect.dependencyIds.forEach((depId) => {
        let sourceHandle: string | undefined = undefined;
        if (depId.startsWith("setter")) {
          sourceHandle = "setterInner";
        } else if (depId.startsWith("state")) {
          sourceHandle = "valueInner";
        }
        const isConcerned = isConcernedLink(component, depId, effect.id);
        this.effectEdges.push({
          id: `${effect.id}-${depId}`,
          source: depId,
          target: effect.id,
          className: "",
          sourceHandle,
          style: {
            transition: "all 100ms ease",
            stroke: isConcerned ? concenredEdgeColor : effectEdgeColor,
            strokeWidth: concernedEdgeWidth,
          },
          animated: isConcerned,
          zIndex: 50,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isConcerned ? concenredEdgeColor : effectEdgeColor,
          },
          data: { sourceComponent: component, isConcerned },
          selectable: false,
        });
      });

      effect.handlingTargetIds.forEach((targetId) => {
        const isConcerned = isConcernedLink(component, effect.id, targetId);
        const targetHandle: string | undefined = targetId.startsWith("setter")
          ? "setter"
          : targetId.startsWith("state")
          ? undefined
          : "concerned";

        const id = `${effect.id}-${targetId}`;
        if (this.effectEdges.find((edge) => edge.id === id)) {
          return;
        }

        this.effectEdges.push({
          id,
          source: effect.id,
          target: targetId.replace("setter", "state"),
          className: "",
          targetHandle,
          style: {
            transition: "all 100ms ease",
            stroke: isConcerned ? concenredEdgeColor : effectEdgeColor,
            strokeWidth: concernedEdgeWidth,
          },
          animated: isConcerned,
          zIndex: 50,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isConcerned ? concenredEdgeColor : effectEdgeColor,
          },
          data: { sourceComponent: component, isConcerned },
          selectable: false,
        });
      });
    });
  }

  private createPropEdges(
    compoents: Component[],
    states: State[],
    props: Prop[]
  ) {
    const newEdges: Edge[] = [];
    compoents.forEach((component) => {
      component.props.forEach((prop) => {
        prop.references.forEach((ref) => {
          if (ref.startsWith("setter")) {
            const nodeId = ref.replace("setter", "state");
            const sourceNode = states.find((target) => target.id === nodeId);

            if (
              !sourceNode ||
              this.propEdges.find((edge) => edge.id === `${ref}-${prop.id}`)
            ) {
              return;
            }
            newEdges.push({
              id: `${ref}-${prop.id}`,
              source: nodeId,
              target: prop.id,
              className: "",
              style: {
                transition: "all 100ms ease",
                stroke: stateSetterEdgeColor,
                strokeWidth: concernedEdgeWidth,
              },
              data: {
                sourceComponent: sourceNode.root,
                targetComponent: component,
                isConcerned: false,
              },
              zIndex: 50,
              sourceHandle: "setter",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: stateSetterEdgeColor,
              },
              animated: true,
              selectable: false,
            });
          } else {
            const sourceNode =
              states.find((target) => target.id === ref) ||
              props.find((target) => target.id === ref);

            if (
              !sourceNode ||
              this.propEdges.find((edge) => edge.id === `${ref}-${prop.id}`)
            ) {
              return;
            }

            const isConcerned = isConcernedLink(sourceNode.root, ref, prop.id);
            newEdges.push({
              id: `${ref}-${prop.id}`,
              source: ref,
              target: prop.id,
              className: "",
              style: {
                transition: "all 100ms ease",
                stroke: isConcerned ? concenredEdgeColor : stateValueEdgeColor,
                strokeWidth: concernedEdgeWidth,
              },
              data: {
                sourceComponent: sourceNode.root,
                targetComponent: component,
                isConcerned,
              },
              zIndex: 50,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isConcerned ? concenredEdgeColor : stateValueEdgeColor,
              },
              animated: true,
              selectable: false,
            });
          }
        });
      });
    });

    this.propEdges.push(...newEdges);
  }

  private updateConcernedComponentEdges() {
    const concernedComponentEdgeIds: string[] = [];
    const checkConcernedEdge = (edge: Edge) => {
      if (!edge.data) {
        return;
      }

      const sourceComponent = (edge.data.sourceComponent as Component).id;
      const targetComponent = (edge.data.targetComponent as Component).id;

      const edgeId = `${sourceComponent}-${targetComponent}`;
      if (
        edge.data.isConcerned &&
        !concernedComponentEdgeIds.includes(edgeId)
      ) {
        concernedComponentEdgeIds.push(edgeId);
      }
    };

    this.propEdges.forEach(checkConcernedEdge);
    concernedComponentEdgeIds.forEach((id) => {
      const edge = this.componentEdges.find((e) => e.id === id);
      if (edge && edge.data) {
        edge.data.isConcerned = true;
        edge.animated = true;
        edge.style = {
          transition: "all 100ms ease",
          stroke: concenredEdgeColor,
          strokeWidth: concernedEdgeWidth,
        };
        edge.markerEnd = {
          type: MarkerType.ArrowClosed,
          color: concenredEdgeColor,
        };
      }
    });
  }

  public getMutableEdges() {
    this.componentEdges = this.componentEdges.map((n) => ({
      ...n,
      className: resetClassName(n.className),
    }));
    this.propEdges = this.propEdges.map((n) => ({
      ...n,
      className: resetClassName(n.className),
    }));
    this.effectEdges = this.effectEdges.map((n) => ({
      ...n,
      className: resetClassName(n.className),
    }));

    return {
      componentEdges: this.componentEdges,
      propEdges: this.propEdges,
      effectEdges: this.effectEdges,
    };
  }

  public getMergedEdges() {
    return [
      ...this.componentEdges,
      ...this.propEdges,
      ...this.effectEdges,
    ] as Edge[];
  }
}
