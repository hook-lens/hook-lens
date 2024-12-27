import * as acorn from "acorn";
import * as espree from "espree";
import * as walk from "acorn-walk";

class UniqueIdGenerator {
  private prefix: string;
  private id: number;

  constructor(prefix: string = "") {
    this.prefix = prefix;
    this.id = 0;
  }

  public next() {
    this.id += 1;
    return `${this.prefix}_${this.id}`;
  }
}

export class ComponentNode {
  private static idGenerator = new UniqueIdGenerator("component");

  readonly id: string;
  readonly path: string;
  readonly fileAst: acorn.Node;
  readonly node: acorn.Node;

  readonly name: string;
  readonly props: PropNode[];
  readonly states: StateNode[];
  readonly effects: EffectNode[];
  readonly children: ComponentNode[];

  propObjectName: string;

  constructor(
    name: string,
    path: string,
    fileAst: acorn.Node,
    node: acorn.Node
  ) {
    this.id = ComponentNode.idGenerator.next();
    this.name = name;
    this.path = path;
    this.props = [];
    this.states = [];
    this.effects = [];
    this.children = [];
    this.fileAst = fileAst;
    this.node = node;
    this.propObjectName = "props";
  }

  public getStateById(id: string) {
    return this.states.find((state) => state.id === id);
  }

  public getStateByName(name: string) {
    return this.states.find((state) => state.name === name);
  }

  public getStateBySetter(setter: string) {
    return this.states.find((state) => state.setter === setter);
  }

  public getStateBySetterId(setterId: string) {
    return this.states.find((state) => state.setterId === setterId);
  }

  public getPropById(id: string) {
    return this.props.find((prop) => prop.id === id);
  }

  public getPropByName(name: string) {
    return this.props.find((prop) => prop.name === name);
  }

  public getChildById(id: string) {
    return this.children.find((child) => child.id === id);
  }
}

export class StateNode {
  private static idGenerator = new UniqueIdGenerator("state");
  private static setterIdGenerator = new UniqueIdGenerator("setter");

  readonly id: string;
  readonly setterId: string;
  readonly name: string;
  readonly root: ComponentNode;
  readonly setter: string;

  constructor(name: string, root: ComponentNode, setter: string) {
    this.id = StateNode.idGenerator.next();
    this.setterId = StateNode.setterIdGenerator.next();
    this.name = name;
    this.root = root;
    this.setter = setter;
  }
}

export class PropNode {
  private static idGenerator = new UniqueIdGenerator("prop");

  readonly id: string;
  readonly name: string;
  readonly root: ComponentNode;

  readonly references: string[];

  constructor(name: string, root: ComponentNode) {
    this.id = PropNode.idGenerator.next();
    this.name = name;
    this.references = [];
    this.root = root;
  }
}

export class EffectNode {
  private static idGenerator = new UniqueIdGenerator("effect");

  readonly id: string;
  readonly name: string;
  readonly root: ComponentNode;
  readonly body: acorn.Node;
  readonly handlingTargetIds: string[];
  readonly dependencyIds: string[];

  constructor(
    name: string,
    root: ComponentNode,
    body: acorn.Node,
    handlingTargetIds: string[],
    dependencyIds: string[]
  ) {
    this.id = EffectNode.idGenerator.next();
    this.name = name;
    this.root = root;
    this.body = body;
    this.handlingTargetIds = handlingTargetIds;
    this.dependencyIds = dependencyIds;
  }
}

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
    for (var i = 0; i < node.children.length; ++i) {
      callback(node.children[i], state);
    }
    if (node.closingElement) {
      callback(node.closingElement, state);
    }
  };

  base.JSXFragment = function (node: any, state: any, callback: any) {
    callback(node.openingFragment, state);
    for (var i = 0; i < node.children.length; ++i) {
      callback(node.children[i], state);
    }
    callback(node.closingFragment, state);
  };
}

export default class HookExtractor {
  readonly componentList: ComponentNode[];
  readonly stateList: StateNode[];
  readonly propList: PropNode[];
  readonly effectList: EffectNode[];
  readonly fileList: {
    filePath: string;
    source: string;
    ast: acorn.Node;
    defaultModule: string;
  }[];

  constructor() {
    this.componentList = [];
    this.stateList = [];
    this.propList = [];
    this.effectList = [];
    this.fileList = [];
  }

  public setProject(files: { source: string; content: string }[]) {
    console.info("setProject", files);
    for (const file of files) {
      if (!file.source.includes("node_modules")) {
        this.extractComponents(file.source, file.content);
      }
    }

    this.linkComponents();
    this.linkEffects();
  }

  private extractComponents(filePath: string, content: string) {
    console.info("extractComponents", filePath);

    const ast = this.parseJsFile(content);
    const defaultModule = this.extractDefaultModule(ast);
    console.log("extractComponents - ast", ast);
    this.fileList.push({ filePath, source: content, ast, defaultModule });

    extend(walk.base);
    walk.fullAncestor<ComponentNode[]>(ast, (node, state, ancestor) => {
      if (!this.isComponent(node)) {
        return;
      }

      const name =
        node.type === "FunctionDeclaration"
          ? (node as acorn.FunctionDeclaration).id?.name
          : this.getArrowFunctionName(ancestor);

      if (!name || this.getComponentByName(name)) {
        return;
      }

      this.newComponentNode(name, filePath, ast, node);
    });

    console.info("extractComponents - All components", this.componentList);
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

  private extractDefaultModule(ast: acorn.Node) {
    let defaultModule = "";
    extend(walk.base);
    walk.simple(
      ast,
      {
        ExportDefaultDeclaration: (node) => {
          defaultModule = (node.declaration as acorn.Identifier).name;
        },
      },
      walk.base
    );

    return defaultModule;
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
    walk.full(node, (node) => {
      if (node.type === "JSXElement") {
        isComponent = true;
      }
    });

    return isComponent;
  }

  private getArrowFunctionName(ancestors: acorn.Node[]) {
    const parent = ancestors[ancestors.length - 2];
    if (parent && parent.type === "VariableDeclarator") {
      return ((parent as acorn.VariableDeclarator).id as acorn.Identifier).name;
    }
    return null;
  }

  private newComponentNode(
    name: string,
    path: string,
    fileAst: acorn.Node,
    node: acorn.Node
  ) {
    const newComponent = new ComponentNode(name, path, fileAst, node);
    this.extractAndPushStates(node, newComponent);
    this.extractAndPushProps(node, newComponent);

    this.componentList.push(newComponent);
    return newComponent;
  }

  private extractAndPushStates(
    astComponent: acorn.Node,
    component: ComponentNode
  ) {
    console.info("extractAndPushStates", astComponent);
    walk.fullAncestor(astComponent, (node, state, ancestor) => {
      if (node.type !== "CallExpression") {
        return;
      }

      if (!this.isCalleeUseState((node as acorn.CallExpression).callee)) {
        return;
      }

      console.log("extractAndPushStates - useState", node, ancestor.slice(0));
      const parent = ancestor[ancestor.length - 2];
      if (!parent || parent.type !== "VariableDeclarator") {
        return;
      }

      const returnValues = (
        (parent as acorn.VariableDeclarator).id as acorn.ArrayPattern
      ).elements;
      const name = (returnValues[0] as acorn.Identifier).name;
      const setter = (returnValues[1] as acorn.Identifier).name;
      component.states.push(this.newStateNode(component, name, setter));
    });
  }

  private isCalleeUseState(callee: acorn.Expression | acorn.Super) {
    if (callee.type === "Identifier") {
      return (callee as acorn.Identifier).name === "useState";
    }

    if (callee.type === "MemberExpression") {
      return (callee.property as acorn.Identifier).name === "useState";
    }

    return false;
  }

  private newStateNode(root: ComponentNode, name: string, setter: string) {
    const newState = new StateNode(name, root, setter);

    this.stateList.push(newState);
    return newState;
  }

  private extractAndPushProps(
    astComponent: acorn.Node,
    component: ComponentNode
  ) {
    console.info("extractProps", astComponent);
    const params =
      astComponent.type === "ArrowFunctionExpression"
        ? (astComponent as acorn.ArrowFunctionExpression).params
        : (astComponent as acorn.FunctionDeclaration).params;

    if (params.length === 0) {
      return;
    }

    // Desturcturing props
    if (params[0].type === "ObjectPattern") {
      params[0].properties.forEach((property) => {
        if (property.type === "Property") {
          const name = (property.key as acorn.Identifier).name;
          component.props.push(this.newPropNode(component, name));
        }
      });
    } else if (params[0].type === "Identifier") {
      component.propObjectName = (params[0] as acorn.Identifier).name;
    }
  }

  private newPropNode(root: ComponentNode, name: string) {
    const newProp = new PropNode(name, root);
    this.propList.push(newProp);
    return newProp;
  }

  private extractImportedComponents(ast: acorn.Node, source: string) {
    const currentPath = source.split("/").slice(0, -1).join("/");
    console.info("getImportedComponents", currentPath);

    const importedComponents: string[] = [];
    walk.simple(ast, {
      ImportDeclaration: (node) => {
        const source = ((node.source as acorn.Literal).value as string) || "";

        walk.simple(node, {
          ImportSpecifier: (node) => {
            const name = (node.imported as acorn.Identifier).name;
            const component = this.getComponentByName(name);
            if (component) {
              importedComponents.push(component.id);
            }
          },
          ImportDefaultSpecifier: (node) => {
            const name = this.getDefaultModuleName(source, currentPath);
            const component = this.getComponentByName(name);
            if (component) {
              importedComponents.push(component.id);
            }
          },
        });
      },
    });

    return importedComponents;
  }

  private getDefaultModuleName(relativePath: string, currentPath: string) {
    const relativePathParts = relativePath.split("/");
    const currentPathParts = currentPath.split("/");
    let hierarchy = currentPathParts.length;
    let absolutePathIndex = -1;
    relativePathParts.forEach((part, i) => {
      if (part === "..") {
        absolutePathIndex = i;
        hierarchy--;
      } else if (part === ".") {
        absolutePathIndex = i;
      }
    });

    if (absolutePathIndex < 0) {
      return "";
    }

    const modifiedPath = currentPath
      .split("/")
      .slice(0, hierarchy)
      .concat(relativePathParts.slice(absolutePathIndex + 1))
      .join("/");
    console.log(
      "getDefaultModule",
      relativePath,
      modifiedPath,
      this.fileList.find((ast) => ast.filePath.startsWith(modifiedPath))
    );

    return (
      this.fileList.find((ast) => ast.filePath.startsWith(modifiedPath))
        ?.defaultModule || ""
    );
  }

  private linkComponents() {
    console.info("linkComponents");
    this.componentList.forEach((component) => {
      walk.full(component.node, (node) => {
        if (node.type !== "JSXElement") {
          return;
        }

        const openingElement = (node as any).openingElement;
        const child = this.getComponentByName(openingElement.name.name);

        if (!child) return;

        console.log("linkComponents", component, child, openingElement);
        component.children.push(child);
      });
    });

    this.componentList.sort(
      (a, b) => this.countDecendent(b) - this.countDecendent(a)
    );
    
    console.log("linkComponents - sorted", this.componentList);

    this.componentList.forEach((component) => {
      walk.full(component.node, (node) => {
        if (node.type !== "JSXElement") {
          return;
        }

        const openingElement = (node as any).openingElement;
        const child = this.getComponentByName(openingElement.name.name);

        if (!child) return;

        console.log("linkComponents", component, child, openingElement);
        this.extractAttributes(child, openingElement.attributes, component);
      });
    });
  }

  private extractAttributes(
    component: ComponentNode,
    attributes: any[],
    parent: ComponentNode
  ) {
    console.info("extractAttribute", component, attributes);
    for (const attribute of attributes) {
      if (attribute.type === "JSXAttribute") {
        const name = attribute.name.name;
        let targetProp = component.getPropByName(name);
        if (!targetProp) {
          console.log("extractAttribute - new prop", component, attribute);
          targetProp = this.newPropNode(component, name);
          component.props.push(targetProp);
        }

        const expression = attribute.value.expression;
        const findAndPushReferenceId = (name: string, targetProp: PropNode) => {
          const reference =
            parent.getStateByName(name) || parent.getPropByName(name);
          const setter = parent.getStateBySetter(name);

          if (
            reference &&
            reference.id !== targetProp.id &&
            !targetProp.references.includes(reference.id)
          ) {
            targetProp.references.push(reference.id);
          } else if (
            setter &&
            !targetProp.references.includes(setter.setterId)
          ) {
            targetProp.references.push(setter.setterId);
          }
        };

        if (expression.type === "Identifier") {
          findAndPushReferenceId(
            (expression as acorn.Identifier).name,
            targetProp
          );
        } else if (expression.type === "MemberExpression") {
          const property = (expression as acorn.MemberExpression).property;
          walk.simple(property, {
            Identifier: (node) =>
              findAndPushReferenceId(node.name, targetProp!),
          });
        }
      } else if (attribute.type === "JSXSpreadAttribute") {
        const expression = attribute.argument;
        if (expression.type === "Identifier" && expression.name === "props") {
          parent.props.forEach((prop) => {
            const targetProp = component.getPropByName(prop.name);
            if (!targetProp) {
              console.log("extractAttribute - new prop", component, prop);
              const newProp = this.newPropNode(component, prop.name);
              newProp.references.push(prop.id);
              component.props.push(newProp);
            }
          });
        }
      }
    }
  }

  private linkEffects() {
    this.componentList.forEach((component) => {
      this.extractAndPushEffects(component);
    });
  }

  private extractAndPushEffects(component: ComponentNode) {
    console.info("extractAndPushEffects", component);
    const astComponent = component.node;
    walk.full(astComponent, (node) => {
      if (node.type !== "CallExpression") {
        return;
      }

      const callee = (node as acorn.CallExpression).callee;
      if (callee.type !== "Identifier" || callee.name !== "useEffect") {
        return;
      }

      // FIXME: Make trace callstack
      const name = callee.name;
      console.log("extractAndPushEffects - callee", node);
      const args = (node as acorn.CallExpression).arguments;
      const dependencieIds: string[] = [];

      if (args[1] && args[1].type === "ArrayExpression") {
        args[1].elements.forEach((element) => {
          if (!element) return;

          let name = "";
          if (element.type === "Identifier") {
            name = element.name;
          } else if (
            element.type === "MemberExpression" &&
            (element.object as acorn.Identifier).name ===
              component.propObjectName
          ) {
            name = (element.property as acorn.Identifier).name;
          }

          const target =
            component.getStateByName(name) || component.getPropByName(name);
          if (target && !dependencieIds.includes(target.id)) {
            dependencieIds.push(target.id);
          }
        });
      }

      console.log("extractAndPushEffects - dependencies", dependencieIds);
      const handlingTargetIds = this.extractCallExpression(component, args[0]);
      const effect = this.newEffectNode(
        component,
        name,
        args[0],
        handlingTargetIds,
        dependencieIds
      );
      component.effects.push(effect);
    });
  }

  private extractCallExpression(
    component: ComponentNode,
    effectBody: acorn.Expression | acorn.SpreadElement
  ) {
    const handlingTargetIds: string[] = [];
    const findAndPushReferenceId = (name: string) => {
      const reference =
        component.getStateBySetter(name) || component.getPropByName(name);
      if (reference && !handlingTargetIds.includes(reference.id)) {
        handlingTargetIds.push(reference.id);
      }
    };

    walk.simple(effectBody, {
      CallExpression: (node) => {
        const callee = node.callee;
        if (callee.type === "Identifier") {
          findAndPushReferenceId((callee as acorn.Identifier).name);
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
    root: ComponentNode,
    name: string,
    body: acorn.Node,
    handlingTargetIds: string[],
    dependencyIds: string[]
  ) {
    const newEffect = new EffectNode(
      name,
      root,
      body,
      handlingTargetIds,
      dependencyIds
    );
    this.effectList.push(newEffect);
    return newEffect;
  }

  public print() {
    console.log("Components", this.componentList);
    console.log("States", this.stateList);
    console.log("Props", this.propList);
    console.log("Effects", this.effectList);

    console.log(
      "Chidren count",
      this.componentList.map((component) => ({
        component: component,
        count: this.countDecendent(component),
      }))
    );
  }

  public getComponentById(id: string) {
    return this.componentList.find((component) => component.id === id);
  }

  public getComponentByName(name: string) {
    return this.componentList.find((component) => component.name === name);
  }

  public getStateById(id: string) {
    return this.stateList.find((state) => state.id === id);
  }

  public getStateByName(name: string) {
    return this.stateList.find((state) => state.name === name);
  }

  public getStateBySetter(setter: string) {
    return this.stateList.find((state) => state.setter === setter);
  }

  public getPropById(id: string) {
    return this.propList.find((prop) => prop.id === id);
  }

  public getPropByName(name: string) {
    return this.propList.find((prop) => prop.name === name);
  }

  public getEffectById(id: string) {
    return this.effectList.find((effect) => effect.id === id);
  }

  public getEffectByName(name: string) {
    return this.effectList.find((effect) => effect.name === name);
  }

  public getSourceCode(component: ComponentNode) {
    return this.fileList.find((file) => file.filePath === component.path)
      ?.source;
  }

  public toJson() {
    const componentList = {
      total: this.componentList.length,
      items: this.componentList.map((component) => {
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
      total: this.stateList.length,
      items: this.stateList.map((state) => ({
        id: state.id,
        name: state.name,
        root: state.root.id,
      })),
    };

    const effectList = {
      total: this.effectList.length,
      items: this.effectList.map((effect) => ({
        id: effect.id,
        root: effect.root.id,
        handlingTargetIds: effect.handlingTargetIds,
        dependencyIds: effect.dependencyIds,
      })),
    };

    const propList = {
      total: this.propList.length,
      items: this.propList.map((prop) => ({
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
    component: ComponentNode,
    callback: (node: ComponentNode) => void
  ) {
    const visited: string[] = [];
    component.children.forEach((child) => {
      if (visited.includes(child.id)) {
        return;
      }

      visited.push(child.id);
      callback(child);
      this.visitDecendent(child, callback);
    });
  }

  public countDecendent(component: ComponentNode) {
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
