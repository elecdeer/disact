import type * as mdast from "mdast";
import { toArray } from "../../util/toArray";
import { mapChildren } from "./markdown";
import { type IntrinsicsNode, phrasingContentTypes } from "./types";

export const transformLinkNode = (
  element: IntrinsicsNode<"a">,
): [mdast.Link] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "link",
      url: element.props.href,
      children: mapChildren(children, phrasingContentTypes),
    } satisfies mdast.Link,
  ];
};
