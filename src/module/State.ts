import { LinePosition, TokenPosition } from "../types/SourceCode";
import { Component } from "./Component";
import { IdGenerator } from "./IdGenerator";

export class State {
  private static idGenerator = new IdGenerator("state");
  private static setterIdGenerator = new IdGenerator("setter");

  readonly id: string;
  readonly setterId: string;
  readonly name: string;
  readonly setter: string;
  readonly root: Component;
  readonly definingPosition: LinePosition;
  readonly accessingPositions: TokenPosition[] = [];
  readonly accessingSetterPositions: TokenPosition[] = [];
  readonly nicknames: string[] = [];
  readonly setterNicknames: string[] = [];
  readonly dereferences: string[] = [];

  isValuableAccess: boolean = false;
  isValuableSetterAccess: boolean = false;

  constructor(
    name: string,
    setter: string,
    root: Component,
    definingPosition: LinePosition
  ) {
    this.id = State.idGenerator.next();
    this.setterId = State.setterIdGenerator.next();
    this.name = name;
    this.setter = setter;
    this.root = root;
    this.definingPosition = definingPosition;
  }

  public addDereferenceComponent(dereference: string) {
    if (!this.dereferences.includes(dereference)) {
      this.dereferences.push(dereference);
    }
  }
}
