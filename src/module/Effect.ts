import * as acorn from "acorn";

import { Component } from "./Component";
import { IdGenerator } from "./IdGenerator";
import { LinePosition } from "../types/SourceCode";

export class Effect {
  private static idGenerator = new IdGenerator("effect");

  readonly id: string;
  readonly root: Component;
  readonly body: acorn.Node;
  readonly handlingTargetIds: string[];
  readonly dependencyIds: string[];
  readonly definingPosition: LinePosition;

  constructor(
    root: Component,
    body: acorn.Node,
    handlingTargetIds: string[],
    dependencyIds: string[],
    definingPosition: LinePosition
  ) {
    this.id = Effect.idGenerator.next();
    this.root = root;
    this.body = body;
    this.handlingTargetIds = handlingTargetIds;
    this.dependencyIds = dependencyIds;
    this.definingPosition = definingPosition;
  }
}
