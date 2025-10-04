import type * as mdast from "mdast";
import { toArray } from "../../util/toArray";
import { mapChildren } from "./markdown";
import { blockContentTypes, type IntrinsicsNode } from "./types";

export const transformOrderedListNode = (
  element: IntrinsicsNode<"ol">,
): [mdast.List] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "list",
      ordered: true,
      spread: false,
      start: element.props.start,
      children: mapChildren(children, ["li"]),
    } satisfies mdast.List,
  ];
};

export const transformUnorderedListNode = (
  element: IntrinsicsNode<"ul">,
): [mdast.List] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "list",
      ordered: false,
      spread: false,
      children: mapChildren(children, ["li"]),
    } satisfies mdast.List,
  ];
};

const listItemChildContentTypes = [...blockContentTypes, "text"] as const;
export const transformListItemNode = (
  element: IntrinsicsNode<"li">,
): [mdast.ListItem] => {
  const children = toArray(element.props.children ?? []);

  return [
    {
      type: "listItem",
      spread: false,
      children: mapChildren(children, listItemChildContentTypes).map(
        (child) => {
          if (child?.type === "text") {
            return {
              type: "paragraph",
              children: [child],
            } satisfies mdast.Paragraph;
          }
          return child;
        },
      ),
    } satisfies mdast.ListItem,
  ];
};
