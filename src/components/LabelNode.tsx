import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';

type LabelNode = Node<{ label: string }, 'label'>;
 
export default function LabelNode({ data }: NodeProps<LabelNode>) {
  return (
    <>
      <div className='label-content'>
        <div>{data.label}</div>
      </div>
    </>
  );
}
