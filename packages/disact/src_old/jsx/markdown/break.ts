import type * as mdast from "mdast";
import type { IntrinsicsNode } from "./types";

export const transformBreakNode = (_element: IntrinsicsNode<"br">): [mdast.Break] => {
  return [
    {
      type: "break",
    } satisfies mdast.Break,
  ];
};
