import type * as mdast from "mdast";
import { toArray } from "../../util/toArray";
import { mapChildren } from "./markdown";
import { type IntrinsicsNode, phrasingContentTypes } from "./types";

export const transformParagraphNode = (element: IntrinsicsNode<"p">): [mdast.Paragraph] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "paragraph",
      children: mapChildren(children, phrasingContentTypes),
    } satisfies mdast.Paragraph,
  ];
};
