import { ComponentNodeProps } from "./NodeData";

export interface File {
  uid: number;
  name: string;
  isDirectory: boolean;
  children: File[];
  componentNodes?: ComponentNodeProps[];
}
