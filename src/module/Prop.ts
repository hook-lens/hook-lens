import { TokenPosition } from "../types/SourceCode";
import { Component } from "./Component";
import { IdGenerator } from "./IdGenerator";

export class Prop {
  private static idGenerator = new IdGenerator("prop");

  readonly id: string;
  readonly name: string;
  readonly root: Component;
  readonly references: string[] = [];
  readonly dereferences: string[] = [];
  readonly definingPosition: TokenPosition;
  readonly accessingPositions: TokenPosition[] = [];
  readonly nicknames: string[] = [];

  originState: string = "";
  isValuableAccess: boolean = false;

  constructor(name: string, root: Component, definingPosition: TokenPosition) {
    this.id = Prop.idGenerator.next();
    this.name = name;
    this.root = root;
    this.definingPosition = definingPosition;
  }

  public addReference(reference: string) {
    if (!this.references.includes(reference)) {
      this.references.push(reference);
    }
  }

  public addDereferenceComponent(dereference: string) {
    if (!this.dereferences.includes(dereference)) {
      this.dereferences.push(dereference);
    }
  }
}
