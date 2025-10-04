import type * as mdast from "mdast";
import { toArray } from "../../util/toArray";
import { mapChildren } from "./markdown";
import { blockContentTypes, type IntrinsicsNode } from "./types";

export const transformBlockquoteNode = (
  element: IntrinsicsNode<"blockquote">,
): [mdast.Blockquote] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "blockquote",
      children: mapChildren(children, blockContentTypes),
    } satisfies mdast.Blockquote,
  ];
};
