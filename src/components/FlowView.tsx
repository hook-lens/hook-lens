import { ReactFlowProvider } from "@xyflow/react";
import MainView, { MainViewProps } from "./MainView";

export default function FlowView ({ hookExtractor }: MainViewProps) {
  return (
    <ReactFlowProvider>
      <MainView hookExtractor={hookExtractor} />
    </ReactFlowProvider>
  );
}
