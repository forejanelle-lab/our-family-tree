"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export type UnionFlowNode = Node<Record<string, never>, "union">;

export function UnionNode(_props: NodeProps<UnionFlowNode>) {
  return (
    <div className="relative flex h-[14px] w-[14px] items-center justify-center">
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-none !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-none !bg-transparent" />
      <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_0_3px_rgba(212,175,55,0.18)]" />
    </div>
  );
}
