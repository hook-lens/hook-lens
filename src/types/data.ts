export interface StateProps {
  id: string;
  name: string;
  // component id
  root: string;
}

export interface StateListProps {
  total: number;
  items: StateProps[];
}

export interface PropProps {
  id: string;
  name: string;
  // component id
  root: string;
}

export interface PropListProps {
  total: number;
  items: PropProps[];
}

export interface EffectProps {
  id: string;
  name: string;
  // state or prop id
  dependencyIds: string[];
}

export interface EffectListProps {
  total: number;
  items: EffectProps[];
}

export interface ComponentProps {
  id: string;
  name: string;
  // prop id
  props: string[];
  // state id
  states: string[];
  // effect id
  effects: string[];
  // component id
  children: string[];
}

export interface HierarchyComponent extends Omit<ComponentProps, "children"> {
  children: HierarchyComponent[];
}

export interface ComponentListProps {
  total: number;
  items: ComponentProps[];
}

export interface DataProps {
  componentList: ComponentListProps;
  states: StateListProps;
  props: PropListProps;
  effects: EffectListProps;
}
