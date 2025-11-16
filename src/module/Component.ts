import * as acorn from "acorn";

import { IdGenerator } from "./IdGenerator";
import { Effect } from "./Effect";
import { Prop } from "./Prop";
import { State } from "./State";
import { LinePosition, TokenPosition } from "../types/SourceCode";

export class Component {
  private static idGenerator = new IdGenerator("component");

  readonly id: string;
  readonly path: string;
  readonly node: acorn.Node;
  readonly definingPosition: LinePosition;

  readonly name: string;
  readonly props: Prop[] = [];
  readonly states: State[] = [];
  readonly effects: Effect[] = [];
  readonly children: Component[] = [];
  readonly importPaths: Map<string, string>;

  propObjectName: string = "props";
  propObjectPosition: TokenPosition | undefined = undefined;

  constructor(
    name: string,
    path: string,
    node: acorn.Node,
    definingPosition: LinePosition,
    importPaths: Map<string, string>
  ) {
    this.id = Component.idGenerator.next();
    this.name = name;
    this.path = path;
    this.node = node;
    this.definingPosition = definingPosition;
    this.importPaths = importPaths;
  }

  // public getStateById(id: string) {
  //   return this.states.find((state) => state.id === id);
  // }

  public getStateByName(name: string) {
    return this.states.find((state) => state.name === name);
  }

  public getStateBySetter(setter: string) {
    return this.states.find((state) => state.setter === setter);
  }

  // public getStateBySetterId(setterId: string) {
  //   return this.states.find((state) => state.setterId === setterId);
  // }

  public getPropById(id: string) {
    return this.props.find((prop) => prop.id === id);
  }

  public getPropByName(name: string) {
    return this.props.find((prop) => prop.name === name);
  }

  public getChildById(id: string) {
    return this.children.find((child) => child.id === id);
  }

  public getChildByName(name: string) {
    return this.children.find((child) => child.name === name);
  }
}
