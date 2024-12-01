import React, { useEffect } from "react";
import "./App.css";
import * as acorn from "acorn";
import * as espree from "espree";
import * as walk from "acorn-walk";


// From acorn-jsx-walk
function extend(base: any) {
  if (base === void 0) base = {};

  // prettier-ignore
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

interface IComponentNode {
  id: string;
  name: string;
  props: IPropNode[];
  states: IStateNode[];
  effects: string[];
  children: string[];
  node: acorn.Node;
}

interface IStateNode {
  id: string;
  name: string;
  root: string;
  setter: string;
}

interface IPropNode {
  id: string;
  name: string;
  root: string;
}

interface IEffectNode {
  id: string;
  name: string;
  root: string;
  body: acorn.Node;
  dependencies: string[];
}

class HookExtractor {
  componentId: number;
  stateId: number;
  propId: number;
  effectId: number;
  componentList: IComponentNode[];
  stateList: IStateNode[];
  propList: IPropNode[];
  effectList: IEffectNode[];
  asts: acorn.Node[];

  constructor() {
    this.componentId = 0;
    this.stateId = 0;
    this.propId = 0;
    this.effectId = 0;
    this.componentList = [];
    this.stateList = [];
    this.propList = [];
    this.effectList = [];
    this.asts = [];
  }

  private newComponentId() {
    this.componentId += 1;
    return "component_" + this.componentId;
  }

  private newComponentNode(name: string, node: acorn.Node) {
    const id = this.newComponentId();
    const states = this.findState(node, id);
    const props = this.findProps(node, id);
    return {
      id: id,
      name: name,
      props: props,
      states: states,
      effects: [],
      children: [],
      node: node,
    };
  }

  private findState(component: acorn.Node, componentId: string) {
    const states: IStateNode[] = [];
    walk.fullAncestor(component, (node, state, ancestor) => {
      if (node.type !== "CallExpression") {
        return;
      }

      if (
        (node as acorn.CallExpression).callee.type === "Identifier" &&
        ((node as acorn.CallExpression).callee as acorn.Identifier).name ===
          "useState"
      ) {
        console.log("CallExpression", node, ancestor.slice(0));
        const parent = ancestor[ancestor.length - 2];
        if (!parent || parent.type !== "VariableDeclarator") {
          return;
        }

        const returnValue = (parent as acorn.VariableDeclarator)
          .id as acorn.ArrayPattern;
        const name = (returnValue.elements[0] as acorn.Identifier).name;
        const setter = (returnValue.elements[1] as acorn.Identifier).name;
        states.push(this.newStateNode(componentId, name, setter));
      }
    });

    this.stateList = this.stateList.concat(states);
    return states;
  }

  private newStateId() {
    this.stateId += 1;
    return "state_" + this.stateId;
  }

  private newStateNode(root: string, name: string, setter: string) {
    const id = this.newStateId();
    return { id, name, root, setter };
  }

  private findProps(component: acorn.Node, componentId: string) {
    console.log("findProps", component);
    const props: IPropNode[] = [];
    const params =
      component.type === "ArrowFunctionExpression"
        ? (component as acorn.ArrowFunctionExpression).params
        : (component as acorn.FunctionDeclaration).params;

    if (params.length === 0) {
      return props;
    } else if (params.length === 1 && params[0].type === "ObjectPattern") {
      console.log("check");
      for (const property of (params[0] as acorn.ObjectPattern).properties) {
        if (property.type === "Property") {
          const name = (property.key as acorn.Identifier).name;
          props.push(this.newPropNode(componentId, name));
        }
      }
    }

    this.propList = this.propList.concat(props);
    return props;
  }

  private newPropId() {
    this.propId += 1;
    return "prop_" + this.propId;
  }

  private newPropNode(root: string, name: string) {
    const id = this.newPropId();
    return { id, name, root };
  }

  private getArrowFunctionName(ancestors: acorn.Node[]) {
    const parent = ancestors[ancestors.length - 2];
    if (parent && parent.type === "VariableDeclarator") {
      console.log(
        "parent",
        ((parent as acorn.VariableDeclarator).id as acorn.Identifier).name
      );
      return ((parent as acorn.VariableDeclarator).id as acorn.Identifier).name;
    }
    return null;
  }

  private isComponent(node: acorn.Node) {
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

  public extract(ast: acorn.Node) {
    console.log("extract", ast);
    this.asts.push(ast);

    extend(walk.base);
    walk.fullAncestor<IComponentNode[]>(ast, (node, state, ancestor) => {
      if (node.type === "FunctionDeclaration" && this.isComponent(node)) {
        console.log("isComponent", "FunctionDeclaration", node);
        const name = (node as acorn.FunctionDeclaration).id?.name || null;

        if (
          name === null ||
          this.componentList.find((component) => component.name === name)
        ) {
          return;
        }

        const component = this.newComponentNode(name, node);
        this.componentList.push(component);
      } else if (
        node.type === "ArrowFunctionExpression" &&
        this.isComponent(node)
      ) {
        console.log("isComponent", "ArrowFunctionExpression", node);
        const name = this.getArrowFunctionName(ancestor);

        if (
          name === null ||
          this.componentList.find((component) => component.name === name)
        ) {
          return;
        }

        const component = this.newComponentNode(name, node);
        this.componentList.push(component);
      }
    });

    console.log("Current components", this.componentList);
  }

  private findAttribute(component: IComponentNode, openingElement: any) {
    for (const attribute of openingElement.attributes) {
      if (attribute.type === "JSXAttribute") {
        const name = attribute.name.name;
        const target = component.props.find((prop) => prop.name === name);

        if (!target) {
          console.log("target", component, attribute);
          const prop = this.newPropNode(component.id, name);
          component.props.push(prop);
          this.propList.push(prop);
        }
      }
    }
  }

  public linkComponents() {
    for (const component of this.componentList) {
      walk.full(component.node, (node) => {
        if (node.type === "JSXElement") {
          const openingElement = (node as any).openingElement;
          const name = openingElement.name.name;
          const target = this.componentList.find(
            (component) => component.name === name
          );

          if (target) {
            console.log("target", component, target, openingElement);
            this.findAttribute(target, openingElement);
            component.children.push(target.id);
          }
        }
      });
    }
  }

  private findEffects(component: IComponentNode) {
    const componentASTNode = component.node;
    const componentId = component.id;

    const effects: IEffectNode[] = [];
    walk.fullAncestor(componentASTNode, (node, state, ancestor) => {
      if (node.type === "CallExpression") {
        const callee = (node as acorn.CallExpression).callee;
        if (callee.type === "Identifier") {
          const name = (callee as acorn.Identifier).name;
          if (name === "useEffect") {
            console.log("useEffect", node);
            const args = (node as acorn.CallExpression).arguments;
            // console.log(
            //   "test",
            //   (args[1] as acorn.ArrayExpression).elements,
            //   component.states,
            //   component.props
            // );
            const dependencies = args[1] ? (args[1] as acorn.ArrayExpression).elements
              .filter(
                (element) =>
                  component.states.find(
                    (state) => state.name === (element as acorn.Identifier).name
                  ) ||
                  component.props.find(
                    (prop) => prop.name === (element as acorn.Identifier).name
                  )
              )
              .map(
                (element) =>
                  (component.states.find(
                    (state) => state.name === (element as acorn.Identifier).name
                  )?.id ||
                    component.props.find(
                      (prop) => prop.name === (element as acorn.Identifier).name
                    )?.id) as string
              ) : [];

            console.log("dependency", dependencies);
            const effect = this.newEffectNode(
              componentId,
              name,
              args[0],
              dependencies
            );
            effects.push(effect);
          }
        }
      }
    });

    component.effects = component.effects.concat(
      effects.map((effect) => effect.id)
    );
    this.effectList = this.effectList.concat(effects);
    return effects;
  }

  private newEffectId() {
    this.effectId += 1;
    return "effect_" + this.effectId;
  }

  private newEffectNode(
    root: string,
    name: string,
    body: acorn.Node,
    dependencies: string[]
  ) {
    const id = this.newEffectId();
    return { id, name, root, body, dependencies };
  }

  public linkEffects() {
    for (const component of this.componentList) {
      const effects = this.findEffects(component);
      component.effects = effects.map((effect) => effect.id);
    }
  }

  public print() {
    console.log("Components", this.componentList);
    console.log("States", this.stateList);
    console.log("Props", this.propList);
    console.log("Effects", this.effectList);
  }
}

function App() {
  const hookExtractor = new HookExtractor();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const asts: {filePath: string, ast: acorn.Node}[] = []

  useEffect(() => {
    const handleFileUpload = (event: Event) => {
      if (inputRef.current && inputRef.current.files) {
        console.log("inputRef", inputRef.current.files);
        const files = inputRef.current.files;
        const promises = [];
        for (let i = 0; i < files.length; i++) {
          if (files[i].name.endsWith(".js") || files[i].name.endsWith(".jsx")) {
            promises.push(files[i].text());
          }
        }

        Promise.all(promises).then((texts) => {
          for (const text of texts) {
            const ast = espree.parse(text, {
              ecmaVersion: "latest",
              sourceType: "module",
              ecmaFeatures: {
                jsx: true,
              },
            });
            asts.push({filePath: "", ast: ast});
            hookExtractor.extract(ast);
          }

          hookExtractor.linkComponents();
          hookExtractor.linkEffects();
          hookExtractor.print();
        });
      }
    }

    if (inputRef.current) {
      inputRef.current.addEventListener("change", handleFileUpload);
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener("change", handleFileUpload);
      }
    }
  }, [inputRef]);

  return (
    <div className="App">
      <div>Hello world</div>
      <input type="file" webkitdirectory="" ref={inputRef}></input>
    </div>
  );
}

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      webkitdirectory?: string;
  }
}

export default App;
