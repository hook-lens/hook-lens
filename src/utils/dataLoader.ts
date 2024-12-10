import { DataProps, ComponentProps, HierarchyComponent } from "../types/data";

export const createHierarchy = (data: DataProps): HierarchyComponent => {
  const components = data.componentList.items;

  // id to component
  const idToComponentMap = new Map<string, ComponentProps>(
    components.map((component) => [component.id, component])
  );

  // find root component
  const root = components.find(
    (component) =>
      !components.some((other) => other.children.includes(component.id))
  );

  if (!root) {
    throw new Error("Root component not found");
  }

  // mapping children
  const mapChildren = (component: ComponentProps): HierarchyComponent => {
    return {
      ...component,
      children: component.children.map((childId) => {
        const childComponent = idToComponentMap.get(childId);
        if (!childComponent) {
          throw new Error(`Component with ID "${childId}" not found`);
        }
        return mapChildren(childComponent);
      }),
    };
  };

  return mapChildren(root);
};
