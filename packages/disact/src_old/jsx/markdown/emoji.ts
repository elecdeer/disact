import type * as mdast from "mdast";
import type { IntrinsicsNode } from "./types";

export const transformEmojiNode = (element: IntrinsicsNode<"emoji">): [mdast.Html] => {
  if (element.props.animated) {
    return [
      {
        type: "html",
        value: `<a:${element.props.name}:${element.props.id}>`,
      } satisfies mdast.Html,
    ];
  }

  return [
    {
      type: "html",
      value: `<:${element.props.name}:${element.props.id}>`,
    } satisfies mdast.Html,
  ];
};
