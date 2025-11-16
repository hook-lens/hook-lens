import * as acorn from "acorn";

export interface SourceCode {
  filePath: string;
  type: "jsx" | "tsx";
  originCode: string;
  jsCode: string;
  jsMap: string | undefined;
  ast: acorn.Node;
}

export interface LinePosition {
  start: number;
  end: number;
}

export interface TokenPosition {
  line: number;
  column: number;
}
