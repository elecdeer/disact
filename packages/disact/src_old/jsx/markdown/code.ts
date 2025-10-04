import type * as mdast from "mdast";
import { toArray } from "../../util/toArray";
import { mapChildren } from "./markdown";
import type { IntrinsicsNode } from "./types";

export const transformInlineCodeNode = (
  element: IntrinsicsNode<"code">,
): [mdast.InlineCode] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "inlineCode",
      value: mapChildren(children, ["text"])
        .map((item) => item.value)
        .join(""),
    } satisfies mdast.InlineCode,
  ];
};

export const transformCodeBlockNode = (
  element: IntrinsicsNode<"pre">,
): [mdast.Code] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "code",
      lang: element.props.lang,
      value: mapChildren(children, ["text"])
        .map((item) => item.value)
        .join(""),
    } satisfies mdast.Code,
  ];
};
