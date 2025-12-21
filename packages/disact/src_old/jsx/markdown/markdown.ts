import type * as mdast from "mdast";
import { gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import { toMarkdown } from "mdast-util-to-markdown";
import { toArray } from "../../util/toArray";
import { transformBlockquoteNode } from "./blockquote";
import { transformBreakNode } from "./break";
import { transformCodeBlockNode, transformInlineCodeNode } from "./code";
import { transformEmojiNode } from "./emoji";
import { transformHeadingNode } from "./heading";
import { transformLinkNode } from "./link";
import {
  transformListItemNode,
  transformOrderedListNode,
  transformUnorderedListNode,
} from "./list";
import {
  transformChannelNode,
  transformGuildNavigationNode,
  transformRoleNode,
  transformSlashCommandNode,
  transformUserNode,
} from "./mentions";
import { transformDeleteNode, transformEmphasisNode, transformStrongNode } from "./modifications";
import { transformParagraphNode } from "./paragraph";
import { transformTimeNode } from "./time";
import { type ElementTypeToMdastNodeMap, type IntrinsicsNode, rootContentTypes } from "./types";

export const mdastToMarkdown = (root: mdast.Root): string => {
  return toMarkdown(root, {
    extensions: [gfmStrikethroughToMarkdown()],
  });
};

/**
 * 再帰的にelementを探索し、type: markdownのelementをmdastに変換する
 * @param element
 * @param transform
 * @returns
 */
export const traverseMarkdown = (
  // oxlint-disable-next-line no-explicit-any: TODO:
  element: Record<PropertyKey, any>,
  transform: (value: object) => object | string,
): object | string => {
  if (typeof element !== "object" || element == null) {
    return element;
  }

  if ("type" in element && element.type === "markdown") {
    return transform(element);
  }

  for (const key in element) {
    if (!Object.hasOwn(element, key)) continue;

    const value = element[key];
    if (Array.isArray(value)) {
      element[key] = value.map((child) => traverseMarkdown(child, transform));
    } else {
      element[key] = traverseMarkdown(value, transform);
    }
  }

  return element;
};

export const transformToMdast = (element: object): mdast.Root => {
  if ("type" in element && element.type === "markdown") {
    return transformNode(element as IntrinsicsNode, ["markdown"])[0] as mdast.Root;
  }

  throw new MdastSemanticError("Expected root element");
};

export class MdastSemanticError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MdastSemanticError";
  }
}

const transformNode = (
  element: IntrinsicsNode | string,
  allowedNodeType: readonly string[],
): (mdast.Nodes | null)[] => {
  if (typeof element === "string") {
    return [
      {
        type: "text",
        value: element,
      } satisfies mdast.Text,
    ];
  }

  const { type, props } = element;
  const children = toArray(props?.children ?? []);

  if (!allowedNodeType.includes(type)) {
    throw new MdastSemanticError(`Invalid node type: ${type}`);
  }

  switch (type) {
    case "markdown": {
      return [
        {
          type: "root",
          children: mapChildren(children, rootContentTypes),
        } satisfies mdast.Root,
      ];
    }

    case "h1":
    case "h2":
    case "h3":
      return transformHeadingNode(element);
    case "p":
      return transformParagraphNode(element);
    case "br":
      return transformBreakNode(element);
    case "a":
      return transformLinkNode(element as IntrinsicsNode<"a">);
    case "i":
      return transformEmphasisNode(element);
    case "b":
      return transformStrongNode(element);
    case "s":
      return transformDeleteNode(element);
    // case "u":
    //   return {
    //     type: "underline",
    //     children,
    //   } as mdast.Underline;
    case "code":
      return transformInlineCodeNode(element);
    case "pre":
      return transformCodeBlockNode(element);
    case "ul":
      return transformUnorderedListNode(element);
    case "ol":
      return transformOrderedListNode(element);
    case "li":
      return transformListItemNode(element);

    case "blockquote":
      return transformBlockquoteNode(element);

    case "time":
      return transformTimeNode(element as IntrinsicsNode<"time">);

    case "user":
      return transformUserNode(element as IntrinsicsNode<"user">);
    case "channel":
      return transformChannelNode(element as IntrinsicsNode<"channel">);
    case "role":
      return transformRoleNode(element as IntrinsicsNode<"role">);
    case "slashCommand":
      return transformSlashCommandNode(element as IntrinsicsNode<"slashCommand">);
    case "guildNav":
      return transformGuildNavigationNode(element as IntrinsicsNode<"guildNav">);

    case "emoji":
      return transformEmojiNode(element as IntrinsicsNode<"emoji">);

    default:
      throw new Error(`Unknown type: ${type}`);
  }
};

// TODO: 循環参照を解消したい
export const mapChildren = <T extends keyof ElementTypeToMdastNodeMap>(
  children: IntrinsicsNode[],
  allowedNodeType: readonly T[],
): ElementTypeToMdastNodeMap[T][] => {
  return children
    .flatMap((child) => transformNode(child, allowedNodeType))
    .filter((item) => item !== null) as ElementTypeToMdastNodeMap[T][];
};
