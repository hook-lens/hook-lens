import * as acorn from "acorn";
import * as walk from "acorn-walk";
import * as espree from "espree";
import ts from "typescript";
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";

import { Component } from "./Component";
import { State } from "./State";
import { Prop } from "./Prop";
import { Effect } from "./Effect";
import { LinePosition, SourceCode, TokenPosition } from "../types/SourceCode";

// From acorn-jsx-walk
function extend(base: any) {
  if (base === void 0) base = {};

  base.JSXExpressionContainer = base.ExpressionStatement;
  base.JSXSpreadChild = base.ExpressionStatement;
  base.JSXClosingFragment = base.Identifier;
  base.JSXEmptyExpression = base.Identifier;
  base.JSXIdentifier = base.Identifier;
  base.JSXOpeningFragment = base.Identifier;
  base.JSXText = base.Identifier;
  base.JSXSpreadAttribute = base.SpreadElement;

  base.JSXAttribute = function (node: any, state: any, callback: any) {
    callback(node.name, state);
    if (node.value) {
      callback(node.value, state);
    }
  };

  base.JSXMemberExpression = function (node: any, state: any, callback: any) {
    callback(node.object, state);
    callback(node.property, state);
  };

  base.JSXNamespacedName = function (node: any, state: any, callback: any) {
    callback(node.namespace, state);
    callback(node.name, state);
  };

  base.JSXOpeningElement = function (node: any, state: any, callback: any) {
    callback(node.name, state);
    for (var i = 0; i < node.attributes.length; ++i) {
      callback(node.attributes[i], state);
    }
  };

  base.JSXClosingElement = function (node: any, state: any, callback: any) {
    callback(node.name, state);
  };

  base.JSXElement = function (node: any, state: any, callback: any) {
    callback(node.openingElement, state);
    for (var i = node.children.length - 1; i >= 0; --i) {
      callback(node.children[i], state);
    }
    if (node.closingElement) {
      callback(node.closingElement, state);
    }
  };

  base.JSXFragment = function (node: any, state: any, callback: any) {
    callback(node.openingFragment, state);
    for (var i = node.children.length - 1; i >= 0; --i) {
      callback(node.children[i], state);
    }
    callback(node.closingFragment, state);
  };
}

function getIdentifierName(identifier: acorn.Node) {
  return identifier.type !== "Identifier"
    ? ""
    : (identifier as acorn.Identifier).name;
}

export default class HookExtractor {
  readonly components: Component[] = [];
  readonly states: State[] = [];
  readonly props: Prop[] = [];
  readonly effects: Effect[] = [];
  readonly scriptFiles: SourceCode[] = [];

  constructor() {}

  public setProject(files: { filePath: string; content: string }[]) {
    // console.info("setProject", files);
    for (const file of files) {
      this.extractComponents(file);
    }

    this.linkComponents();
    this.linkEffects();
    this.updateReferences();
  }

  private extractComponents({
    filePath,
    content,
  }: {
    filePath: string;
    content: string;
  }) {
    console.info("extractComponents", filePath);

    let jsCode = content;
    let jsMap = undefined;
    let isJsx = true;
    if (filePath.endsWith(".tsx")) {
      const result = ts.transpileModule(content, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.Preserve,
          target: ts.ScriptTarget.ESNext,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          sourceMap: true,
        },
      });
      // console.log("typescript file", result);
      jsCode = result.outputText;
      jsMap = result.sourceMapText;
      isJsx = false;
    }

    try {
      const ast = this.parseJsFile(jsCode);
      // console.log("extractComponents - ast", ast);

      this.scriptFiles.push({
        filePath,
        type: isJsx ? "jsx" : "tsx",
        originCode: content,
        jsCode,
        ast,
        jsMap,
      });

      const importPaths = new Map<string, string>();
      const componentPath = filePath.slice().replace(/\/[^/]+$/, "");
      const parentPath = componentPath.slice();
      extend(walk.base);
      walk.simple(ast, {
        ImportDeclaration: (node) => {
          node.specifiers.forEach((specifier) => {
            const name = getIdentifierName(specifier.local);
            const source = (node.source.value as string)
              .replace(/^[@]+/, "")
              .replace(/^([.]{2}\/)+/, (match) => {
                const depth = match.split("../").length - 1;
                let adjustedPath = parentPath;
                for (let i = 0; i < depth; i++) {
                  adjustedPath = adjustedPath.replace(/\/[^/]+$/, "");
                }
                return adjustedPath + "/";
              })
              .replace(/^[.]+/, componentPath);
            importPaths.set(name, source.replace(/\.[^./]+$/, ""));
          });
        },
      });

      walk.fullAncestor(ast, (node, _, ancestor) => {
        if (!this.isComponent(node)) {
          return;
        }

        const isArrowFunction = node.type === "ArrowFunctionExpression";
        const nameNode = isArrowFunction
          ? this.getArrowFunctionNameNode(ancestor)
          : (node as acorn.FunctionDeclaration);
        const name = nameNode && getIdentifierName(nameNode.id);

        if (!name || this.getComponentByPath(name, filePath)) {
          return;
        }

        const startLine =
          this.getPositionFromOffset(jsCode, jsMap, nameNode.start)?.line ?? 0;
        const endLine =
          this.getPositionFromOffset(jsCode, jsMap, node.end)?.line ?? 0;

        this.newComponentNode(
          name,
          filePath,
          node,
          {
            start: startLine,
            end: endLine,
          },
          importPaths
        );
      });
    } catch (e) {
      console.error("extractComponents - Error", filePath, e);
      return;
    }
    // console.info("extractComponents - All components", this.components);
  }

  private getLineColumnFromOffset(
    source: string,
    offset: number
  ): { line: number; column: number } {
    let line = 1;
    let column = 0;

    for (let i = 0; i < offset; i++) {
      if (source[i] === "\n") {
        line++;
        column = 0;
      } else {
        column++;
      }
    }

    return { line, column };
  }

  private getPositionFromOffset(
    jsCode: string,
    jsMap: string | undefined,
    offset: number
  ) {
    if (!jsMap) {
      return this.getLineColumnFromOffset(jsCode, offset);
    }

    const rawSourceMap = JSON.parse(jsMap);
    const traceMap = new TraceMap(rawSourceMap);
    const { line, column } = this.getLineColumnFromOffset(jsCode, offset);

    const result = originalPositionFor(traceMap, { line, column });
    if (result.line === null || result.column === null) {
      return undefined;
    }

    return { line: result.line, column: result.column };
  }

  private parseJsFile(code: string) {
    return espree.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    });
  }

  private isComponent(node: acorn.Node) {
    if (
      node.type !== "FunctionDeclaration" &&
      node.type !== "ArrowFunctionExpression"
    ) {
      return false;
    }

    let isComponent = false;
    extend(walk.base);
    // FIXME: Return value check
    walk.full(node, (n) => {
      n.type === "JSXElement" && (isComponent = true);
    });

    return isComponent;
  }

  private getArrowFunctionNameNode(ancestors: acorn.Node[]) {
    // console.log("getArrowFunctionNameNode", ancestors);

    const slicedAncestors = ancestors.slice(0, -1).reverse();
    // Check if it's in a return statement
    if (
      slicedAncestors.some((n) =>
        ["ArrowFunctionExpression", "functionDeclaration"].includes(n.type)
      )
    ) {
      return null;
    }

    return slicedAncestors.find(
      (n) => n.type === "VariableDeclarator"
    ) as acorn.VariableDeclarator;
  }

  private newComponentNode(
    name: string,
    path: string,
    node: acorn.Node,
    linePosition: LinePosition,
    importPaths: Map<string, string>
  ) {
    const newComponent = new Component(
      name,
      path,
      node,
      linePosition,
      importPaths
    );
    this.extractAndPushStates(newComponent);
    this.extractAndPushProps(newComponent);

    this.components.push(newComponent);
    return newComponent;
  }

  private extractAndPushStates(component: Component) {
    // console.info("extractAndPushStates", component);
    const sourceCode = this.getSourceCode(component);
    if (!sourceCode) {
      return;
    }
    const jsCode = sourceCode.jsCode;
    const jsMap = sourceCode.jsMap;

    walk.ancestor(component.node, {
      CallExpression: (node, _, ancestor) => {
        if (!this.isCalleeName(node.callee, "useState")) {
          return;
        }

        // console.log("extractAndPushStates - useState", node, ancestor.slice(0));
        const parent = ancestor[ancestor.length - 2];
        if (!parent || parent.type !== "VariableDeclarator") {
          return;
        }

        const returnValues = (
          (parent as acorn.VariableDeclarator).id as acorn.ArrayPattern
        ).elements;
        const name = returnValues[0] as acorn.Identifier;
        const setter = returnValues[1] as acorn.Identifier;

        const start =
          this.getPositionFromOffset(jsCode, jsMap, parent.start)?.line || 0;
        const end =
          this.getPositionFromOffset(jsCode, jsMap, node.end)?.line || 0;

        component.states.push(
          this.newStateNode(component, name, setter, { start, end })
        );
      },
    });
  }

  private isCalleeName(callee: acorn.Expression | acorn.Super, target: string) {
    let isTargetCallee = false;
    walk.simple(callee, {
      Identifier: (node) => {
        if (node.name === target) {
          isTargetCallee = true;
        }
      },
      MemberExpression: (node) => {
        if (getIdentifierName(node.property) === target) {
          isTargetCallee = true;
        }
      },
    });

    return isTargetCallee;
  }

  private newStateNode(
    root: Component,
    name: acorn.Identifier,
    setter: acorn.Identifier,
    definingPosition: LinePosition
  ) {
    const newState = new State(
      name.name,
      setter?.name ?? "",
      root,
      definingPosition
    );
    this.states.push(newState);
    return newState;
  }

  private extractAndPushProps(component: Component) {
    // console.info("extractProps", component);
    const sourceCode = this.getSourceCode(component);
    if (!sourceCode) {
      return;
    }

    const jsCode = sourceCode.jsCode;
    const jsMap = sourceCode.jsMap;

    const params =
      component.node.type === "ArrowFunctionExpression"
        ? (component.node as acorn.ArrowFunctionExpression).params
        : (component.node as acorn.FunctionDeclaration).params;

    if (params.length === 0) {
      return;
    }

    // Desturcturing props
    if (params[0].type === "ObjectPattern") {
      params[0].properties
        .filter((property) => property.type === "Property")
        .forEach((property) => {
          const name = getIdentifierName(property.key);
          const definingPosition: TokenPosition | undefined =
            this.getPositionFromOffset(jsCode, jsMap, property.start);
          definingPosition &&
            component.props.push(
              this.newPropNode(component, name, definingPosition)
            );
        });
    } else if (params[0].type === "Identifier") {
      const definingPosition: TokenPosition | undefined =
        this.getPositionFromOffset(jsCode, jsMap, params[0].start);
      component.propObjectName = getIdentifierName(params[0]);
      definingPosition && (component.propObjectPosition = definingPosition);
    }
  }

  private newPropNode(
    root: Component,
    name: string,
    definingPosition: TokenPosition | undefined
  ) {
    const newProp = new Prop(
      name,
      root,
      definingPosition || { line: root.definingPosition.start, column: -1 }
    );
    newProp.accessingPositions.push();
    this.props.push(newProp);
    return newProp;
  }

  private linkComponents() {
    console.info("linkComponents");
    this.components.forEach((component) => {
      const sourceCode = this.getSourceCode(component);
      if (!sourceCode) {
        return;
      }

      const importPaths = component.importPaths;

      walk.full(component.node, (node) => {
        if (node.type !== "JSXElement") {
          return;
        }

        const openingElement = (node as any).openingElement;
        const candidateChildren = this.components.filter(
          (component) => component.name === openingElement.name.name
        );

        if (candidateChildren.length === 0) {
          return;
        }

        candidateChildren.forEach((child) => {
          if (component.getChildById(child.id)) {
            return;
          }

          const importPath = importPaths.get(child.name);
          const isChildFromSameFile =
            child.path
              .slice()
              .replace(/\.[^./]+$/, "")
              .endsWith(importPath ?? "-1") || child.path === component.path;

          if (isChildFromSameFile) {
            component.children.push(child);
          }
        });
      });
    });

    this.components.sort(
      (a, b) => this.countDecendent(b) - this.countDecendent(a)
    );

    this.components.forEach((component) => {
      walk.full(component.node, (node) => {
        if (node.type !== "JSXElement") {
          return;
        }

        const openingElement = (node as any).openingElement;
        const child = component.getChildByName(openingElement.name.name);

        if (!child) {
          return;
        }
        this.extractAttributes(child, openingElement.attributes, component);
      });
    });

    this.components.forEach((component) => {
      component.props.forEach((prop) => {
        prop.references.forEach((referenceId) => {
          if (!referenceId.startsWith("prop")) {
            prop.originState = referenceId;
            return;
          }

          const stack: string[] = [referenceId];
          let currentId = stack.pop();
          while (currentId) {
            const sourceNode = this.getPropById(currentId);
            if (sourceNode === undefined) {
              return;
            }

            if (sourceNode.originState.length > 0) {
              prop.originState = sourceNode.originState;
            } else {
              stack.push(...sourceNode.references);
            }
            currentId = stack.pop();
          }
        });
      });
    });
  }

  private extractAttributes(
    component: Component,
    attributes: any[],
    parent: Component
  ) {
    // console.info("extractAttribute", component, attributes);
    for (const attribute of attributes) {
      if (attribute.type === "JSXAttribute") {
        const name = attribute.name.name;
        if (name === "key") {
          continue;
        }

        let targetProp = component.getPropByName(name);
        if (!targetProp) {
          // console.log("extractAttribute - new prop", component, attribute);
          targetProp = this.newPropNode(
            component,
            name,
            component.propObjectPosition
          );
          component.props.push(targetProp);
        }

        const findAndPushReferenceId = (name: string, targetProp: Prop) => {
          const reference =
            parent.getStateByName(name) || parent.getPropByName(name);
          const setter = parent.getStateBySetter(name);

          if (reference && reference?.id !== targetProp.id) {
            targetProp.addReference(reference.id);
            reference.addDereferenceComponent(targetProp.root.id);
          } else if (setter) {
            targetProp.addReference(setter.setterId);
            setter.addDereferenceComponent(targetProp.root.id);
          }
        };

        const expression = attribute?.value?.expression;
        if (expression?.type === "Identifier") {
          findAndPushReferenceId(getIdentifierName(expression), targetProp);
        } else if (expression?.type === "MemberExpression") {
          const objectName = getIdentifierName(expression.object);
          const propertyName =
            objectName === component.propObjectName
              ? getIdentifierName(expression.property)
              : "";

          findAndPushReferenceId(objectName, targetProp);
          findAndPushReferenceId(propertyName, targetProp);
        }
      } else if (attribute.type === "JSXSpreadAttribute") {
        const expression = attribute.argument;
        const sourceCode = this.getSourceCode(parent);
        if (!sourceCode) {
          return;
        }
        const jsCode = sourceCode.jsCode;
        const jsMap = sourceCode.jsMap;
        const accessingPosition = this.getPositionFromOffset(
          jsCode,
          jsMap,
          expression.start
        );

        if (
          expression.type === "Identifier" &&
          expression.name === parent.propObjectName
        ) {
          parent.props.forEach((prop) => {
            accessingPosition &&
              prop.accessingPositions.push(accessingPosition);
            if (!component.getPropByName(prop.name)) {
              // console.log("extractAttribute - new prop", component, prop);
              const newProp = this.newPropNode(
                component,
                prop.name,
                component.propObjectPosition
              );
              newProp.addReference(prop.id);
              prop.addDereferenceComponent(newProp.root.id);
              component.props.push(newProp);
            }
          });
        }
      }
    }
  }

  private linkEffects() {
    this.components.forEach((component) => {
      this.extractAndPushEffects(component);
    });
  }

  private extractAndPushEffects(component: Component) {
    // console.info("extractAndPushEffects", component);
    const sourceCode = this.getSourceCode(component);
    if (!sourceCode) {
      return;
    }
    const jsCode = sourceCode.jsCode;
    const jsMap = sourceCode.jsMap;

    walk.simple(component.node, {
      CallExpression: (node) => {
        const callee = node.callee;
        if (!this.isCalleeName(callee, "useEffect")) {
          return;
        }

        // FIXME: Make trace callstack
        // console.log("extractAndPushEffects - callee", node);
        const args = node.arguments;
        const dependencyIds: string[] = [];

        if (args[1] && args[1].type === "ArrayExpression") {
          walk.simple(args[1], {
            Identifier: (node) => {
              const target =
                component.getStateByName(node.name) ||
                component.getPropByName(node.name);
              if (target && !dependencyIds.includes(target.id)) {
                dependencyIds.push(target.id);
              }
            },

            MemberExpression: (node) => {
              if (getIdentifierName(node.object) !== component.propObjectName) {
                return;
              }

              const name = getIdentifierName(node.property);
              const target =
                component.getStateByName(name) || component.getPropByName(name);
              if (target && !dependencyIds.includes(target.id)) {
                dependencyIds.push(target.id);
              }
            },
          });
        }

        // console.log("extractAndPushEffects - dependencies", dependencieIds);
        const handlingTargetIds = this.extractCallExpression(
          component,
          args[0]
        );
        const startLine =
          this.getPositionFromOffset(jsCode, jsMap, node.start)?.line ?? 0;
        const endLine =
          this.getPositionFromOffset(jsCode, jsMap, node.end)?.line ?? 0;

        const effect = this.newEffectNode(
          component,
          args[0],
          handlingTargetIds,
          dependencyIds,
          { start: startLine, end: endLine }
        );
        component.effects.push(effect);
      },
    });
  }

  private extractCallExpression(
    component: Component,
    effectBody: acorn.Expression | acorn.SpreadElement
  ) {
    const handlingTargetIds: string[] = [];
    const findAndPushReferenceId = (name: string) => {
      const reference =
        component.getStateBySetter(name)?.setterId ||
        component.getStateByName(name)?.id ||
        component.getPropByName(name)?.id;
      if (reference && !handlingTargetIds.includes(reference)) {
        handlingTargetIds.push(reference);
      }
    };

    walk.simple(effectBody, {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee.type === "Identifier") {
          findAndPushReferenceId(getIdentifierName(callee));
        } else if (callee.type === "MemberExpression") {
          walk.simple((callee as acorn.MemberExpression).property, {
            Identifier: (node) => findAndPushReferenceId(node.name),
          });
        }
      },
    });

    return handlingTargetIds;
  }

  private newEffectNode(
    root: Component,
    body: acorn.Node,
    handlingTargetIds: string[],
    dependencyIds: string[],
    linePosition: LinePosition
  ) {
    const newEffect = new Effect(
      root,
      body,
      handlingTargetIds,
      dependencyIds,
      linePosition
    );
    this.effects.push(newEffect);
    return newEffect;
  }

  private updateReferences() {
    this.components.forEach((component) => {
      this.extractAndPushPropReferences(component);
      this.extractAndPushStateReferences(component);
    });
  }

  private extractAndPushPropReferences(component: Component) {
    const sourceCode = this.getSourceCode(component);
    if (!sourceCode) {
      return;
    }
    const jsCode = sourceCode.jsCode;
    const jsMap = sourceCode.jsMap;

    component.props.forEach((prop) => {
      const pushAccessingPosition = (node: acorn.Node) => {
        const accessingPosition = this.getPositionFromOffset(
          jsCode,
          jsMap,
          node.start
        );

        accessingPosition && prop.accessingPositions.push(accessingPosition);
      };

      const pushNickNamePosition = (node: acorn.Node, nickname: string) => {
        const accessingPosition = this.getPositionFromOffset(
          jsCode,
          jsMap,
          node.start
        );

        if (accessingPosition) {
          prop.nicknames.push(nickname);
          // prop.nicknamePositions.push(accessingPosition);
        }
      };

      const isValuableAccess = (
        node: acorn.Identifier | acorn.MemberExpression,
        ancestors: acorn.Node[]
      ) => {
        const reverseAncestors = ancestors.slice(0, -1).reverse();
        const ancestor = reverseAncestors[0];
        if (ancestor.type === "VariableDeclarator") {
          if ((ancestor as acorn.VariableDeclarator).init === node) {
            pushNickNamePosition(
              node.type === "MemberExpression" ? node.property : node,
              getIdentifierName((ancestor as acorn.VariableDeclarator).id)
            );
          }

          return false;
        } else if (ancestor.type.startsWith("JSX")) {
          const openingElement = reverseAncestors.find(
            (n) => n.type === "JSXOpeningElement"
          ) as any;
          const name = openingElement?.name?.name ?? "";
          const importPath = component.importPaths.get(name);
          const child = component.getChildByName(name);
          const isChildComponent =
            ((importPath &&
              child?.path
                .slice()
                .replace(/\.[^./]+$/, "")
                .endsWith(importPath)) ||
              child?.path === component.path) ??
            false;
          return isChildComponent ? false : true;
        }

        return true;
      };

      walk.ancestor(component.node, {
        Identifier: (node, _, ancestors) => {
          if (
            ancestors[ancestors.length - 2].type === "MemberExpression" ||
            (node.name !== component.propObjectName &&
              node.name !== prop.name &&
              !prop.nicknames.includes(node.name))
          ) {
            return;
          }

          if (isValuableAccess(node, ancestors)) {
            prop.isValuableAccess = true;
          }
          pushAccessingPosition(node);
        },

        MemberExpression: (node, _, ancestors) => {
          const objectName = getIdentifierName(node.object);
          const propertyName = getIdentifierName(node.property);

          const isObjectTypeProp =
            objectName === prop.name || prop.nicknames.includes(objectName);
          const isMemberOfProps =
            objectName === component.propObjectName &&
            propertyName === prop.name;

          if (!isObjectTypeProp && !isMemberOfProps) {
            return;
          }

          if (isValuableAccess(node, ancestors)) {
            prop.isValuableAccess = true;
          }
          pushAccessingPosition(isObjectTypeProp ? node.object : node.property);
        },
      });

      if (prop.name === "children") {
        prop.isValuableAccess = prop.accessingPositions.length > 0;
      }
    });
  }

  private extractAndPushStateReferences(component: Component) {
    const sourceCode = this.getSourceCode(component);
    if (!sourceCode) {
      return;
    }
    const jsCode = sourceCode.jsCode;
    const jsMap = sourceCode.jsMap;

    component.states.forEach((state) => {
      const pushAccessingPosition = (node: acorn.Node, isValue: boolean) => {
        const accessingPosition = this.getPositionFromOffset(
          jsCode,
          jsMap,
          node.start
        );

        if (accessingPosition) {
          if (isValue) {
            state.accessingPositions.push(accessingPosition);
          } else {
            state.accessingSetterPositions.push(accessingPosition);
          }
        }
      };

      const pushNickNamePosition = (
        node: acorn.Node,
        nickname: string,
        isValue: boolean
      ) => {
        const accessingPosition = this.getPositionFromOffset(
          jsCode,
          jsMap,
          node.start
        );

        if (accessingPosition) {
          if (isValue) {
            state.nicknames.push(nickname);
            // state.nicknamePositions.push(accessingPosition);
          } else {
            state.setterNicknames.push(nickname);
            // state.setterNicknamePositions.push(accessingPosition);
          }
        }
      };

      const isValuableAccess = (
        node: acorn.Identifier | acorn.MemberExpression,
        ancestors: acorn.Node[],
        isValue: boolean
      ) => {
        const reverseAncestors = ancestors.slice(0, -1).reverse();
        const ancestor = reverseAncestors[0];
        if (ancestor.type === "VariableDeclarator") {
          if ((ancestor as acorn.VariableDeclarator).init === node) {
            pushNickNamePosition(
              node.type === "MemberExpression" ? node.property : node,
              getIdentifierName((ancestor as acorn.VariableDeclarator).id),
              isValue
            );
          }

          return false;
        } else if (ancestor.type.startsWith("JSX")) {
          return false;
        }

        return true;
      };

      walk.ancestor(component.node, {
        Identifier: (node, _, ancestors) => {
          const isValueIdentifier =
            node.name === state.name || state.nicknames.includes(node.name);
          const isSetterIdentifier =
            node.name === state.setter ||
            state.setterNicknames.includes(node.name);

          if (!isValueIdentifier && !isSetterIdentifier) {
            return;
          }

          if (isValuableAccess(node, ancestors, isValueIdentifier)) {
            if (isValueIdentifier) {
              state.isValuableAccess = true;
            } else {
              state.isValuableSetterAccess = true;
            }
          }
          pushAccessingPosition(node, isValueIdentifier);
        },
        MemberExpression: (node, _, ancestors) => {
          if (getIdentifierName(node.object) !== state.name) {
            return;
          }

          if (isValuableAccess(node, ancestors, true)) {
            state.isValuableAccess = true;
          }

          pushAccessingPosition(node.object, true);
        },
      });
    });
  }

  public print() {
    console.log("Components", this.components);
    console.log("States", this.states);
    console.log("Props", this.props);
    console.log("Effects", this.effects);

    console.log(
      "Chidren count",
      this.components.map((component) => ({
        component: component,
        count: this.countDecendent(component),
      }))
    );
  }

  // public getComponentById(id: string) {
  //   return this.components.find((component) => component.id === id);
  // }

  public getComponentByName(name: string) {
    return this.components.find((component) => component.name === name);
  }

  public getComponentByPath(name: string, path: string) {
    return this.components.find(
      (component) => component.name === name && component.path === path
    );
  }

  // public getStateById(id: string) {
  //   return this.states.find((state) => state.id === id);
  // }

  // public getStateByName(name: string) {
  //   return this.states.find((state) => state.name === name);
  // }

  // public getStateBySetter(setter: string) {
  //   return this.states.find((state) => state.setter === setter);
  // }

  public getPropById(id: string) {
    return this.props.find((prop) => prop.id === id);
  }

  // public getPropByName(name: string) {
  //   return this.props.find((prop) => prop.name === name);
  // }

  // public getEffectById(id: string) {
  //   return this.effects.find((effect) => effect.id === id);
  // }

  public getSourceCode(component: Component) {
    return this.scriptFiles.find((file) => file.filePath === component.path);
  }

  public toJson() {
    const componentList = {
      total: this.components.length,
      items: this.components.map((component) => {
        return {
          id: component.id,
          name: component.name,
          props: component.props.map((prop) => prop.id),
          states: component.states.map((state) => state.id),
          effects: component.effects.map((effect) => effect.id),
          children: component.children.map((child) => child.id),
        };
      }),
    };

    const stateList = {
      total: this.states.length,
      items: this.states.map((state) => ({
        id: state.id,
        name: state.name,
        root: state.root.id,
      })),
    };

    const effectList = {
      total: this.effects.length,
      items: this.effects.map((effect) => ({
        id: effect.id,
        root: effect.root.id,
        handlingTargetIds: effect.handlingTargetIds,
        dependencyIds: effect.dependencyIds,
      })),
    };

    const propList = {
      total: this.props.length,
      items: this.props.map((prop) => ({
        id: prop.id,
        name: prop.name,
        root: prop.root.id,
      })),
    };

    const json = {
      componentList,
      stateList,
      effectList,
      propList,
    };

    return JSON.stringify(json, null, 2);
  }

  public visitDecendent(
    component: Component,
    callback: (node: Component) => void
  ) {
    const visited: string[] = [];
    const stack: Component[] = [...component.children];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        break;
      }

      if (visited.includes(current.id)) {
        continue;
      }

      visited.push(current.id);
      callback(current);
      current.children.forEach((child) => {
        if (!visited.includes(child.id)) {
          stack.push(child);
        }
      });
    }
  }

  public countDecendent(component: Component) {
    let count = 0;
    let visited: string[] = [];
    this.visitDecendent(component, (node) => {
      if (!visited.includes(node.id)) {
        count += 1;
        visited.push(node.id);
      }
    });

    return count;
  }
}
