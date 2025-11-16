import { Node } from "@xyflow/react";
import { Component } from "../module/Component";
import { Prop } from "../module/Prop";
import { State } from "../module/State";

export type IndexData = {
  level: number;
  index: number;
};

export type ComponentNodeData = {
  // Properties
  component: Component;
  isConcerned: boolean;
  isHovered: boolean;

  // Spatial information
  indexData: IndexData;
  size: { width: number; height: number };

  // Event handlers
  openCodeView: (component: Component) => void;
};

export type ComponentNodeProps = Node<
  ComponentNodeData,
  "component" | "expanded"
>;

export type PropNodeData = {
  prop: Prop;
};

export type PropNodeProps = Node<PropNodeData, "prop">;

export type StateNodeData = {
  state: State;
};

export type StateNodeProps = Node<StateNodeData, "state">;

export type EffectNodeData = {
  label: string;
};

export type EffectNodeProps = Node<EffectNodeData, "effect">;
