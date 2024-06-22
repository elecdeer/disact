import type { DisactChildElements } from "../jsx-internal";

import { toMarkdown } from "mdast-util-to-markdown";
import { gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import type * as mdast from "mdast";
import { transformHeadingNode } from "./heading";
import { transformBlockquoteNode } from "./blockquote";
import { transformBreakNode } from "./break";
import { transformLinkNode } from "./link";
import { transformParagraphNode } from "./paragraph";

import {
	transformEmphasisNode,
	transformStrongNode,
	transformDeleteNode,
} from "./modifications";
import { transformInlineCodeNode, transformCodeBlockNode } from "./code";
import {
	transformOrderedListNode,
	transformUnorderedListNode,
	transformListItemNode,
} from "./list";

export const mdastToMarkdown = (root: mdast.Root): string => {
	return toMarkdown(root, {
		extensions: [gfmStrikethroughToMarkdown()],
	});
};

export const toArray = <T>(value: T | T[]): T[] => {
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
};

/**
 * 再帰的にelementを探索し、type: markdownのelementをmdastに変換する
 * @param element
 * @param transform
 * @returns
 */
export const traverseMarkdown = (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	element: Record<PropertyKey, any>,
	transform: (value: object) => object,
): object => {
	if (typeof element !== "object" || element == null) {
		return element;
	}

	if ("type" in element && element.type === "markdown") {
		return transform(element);
	}

	for (const key in element) {
		if (!Object.prototype.hasOwnProperty.call(element, key)) continue;

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
		return transformNode(element as IntrinsicsNode, [
			"markdown",
		])[0] as mdast.Root;
	}

	throw new MdastSemanticError("Expected root element");
};

const excludeNullish = <T>(value: T): value is Exclude<T, null | undefined> =>
	value != null;

export interface IntrinsicElements {
	markdown: { children?: DisactChildElements };

	h1: { children?: DisactChildElements };
	h2: { children?: DisactChildElements };
	h3: { children?: DisactChildElements };

	p: { children?: DisactChildElements };
	br: { children?: never };
	a: { href: string; children?: DisactChildElements };

	i: { children?: DisactChildElements };
	b: { children?: DisactChildElements };
	s: { children?: DisactChildElements };
	u: { children?: DisactChildElements };

	code: { children: DisactChildElements };
	pre: { lang?: string; children: DisactChildElements };

	ul: { children?: DisactChildElements };
	ol: { children?: DisactChildElements; start?: number };
	li: { children?: DisactChildElements };

	blockquote: { children?: DisactChildElements };

	// TODO: markdown内で使う要素はIntrinsicとして提供する
	// time: {
	//   unixtime: number;
	//   children: never;
	//   format?: "f" | "F" | "d" | "t" | "D" | "T" | "R";
	// };

	// user: { id: string; children: never };
	// channel: { id: string; children: never };
	// role: { id: string; children: never };

	// guildNav: {
	//   type: "customize" | "browse" | "guide";
	//   children: never;
	// };

	// slashCommand: {
	//   name: string;
	//   id: string;
	//   children: never;
	// };

	// emoji: {
	//   name: string;
	//   id: string;
	//   animated?: boolean;
	//   children: never;
	// };

	// spoiler: AnyObject;
}

export type IntrinsicsNode<
	T extends keyof IntrinsicElements = keyof IntrinsicElements,
> = {
	type: string;
	props: Omit<IntrinsicElements[T], "children"> & {
		children?: IntrinsicsNode | IntrinsicsNode[];
	};
};

export type ElementType = keyof ElementTypeToMdastNodeMap;

export type ElementTypeToMdastNodeMap = {
	markdown: mdast.Root;
	text: mdast.Text;
	h1: mdast.Heading;
	h2: mdast.Heading;
	h3: mdast.Heading;
	p: mdast.Paragraph;
	br: mdast.Break;
	a: mdast.Link;
	i: mdast.Emphasis;
	b: mdast.Strong;
	s: mdast.Delete;
	// u: mdast.Underline;
	code: mdast.InlineCode;
	pre: mdast.Code;
	ul: mdast.List;
	ol: mdast.List;
	li: mdast.ListItem;
	blockquote: mdast.Blockquote;
};

export const rootContentTypes = [
	"blockquote", // blockquote
	"br", // break
	"pre", // code
	"s", // delete
	"i", // emphasis
	"h1", // heading
	"h2", // heading
	"h3", // heading
	"code", // inlineCode
	"a", // link
	"ol", // list
	"ul", // list
	"p", // paragraph
	"b", // strong
	"text", // text
] as const satisfies ElementType[];

export const phrasingContentTypes = [
	"br", // break
	"s", // delete
	"i", // emphasis
	"code", // inlineCode
	"a", // link
	"b", // strong
	"text", // text
] as const satisfies ElementType[];

export const blockContentTypes = [
	"blockquote", // blockquote
	"pre", // code
	"h1", // heading
	"h2", // heading
	"h3", // heading
	"ol", // list
	"ul", // list
	"p", // paragraph
] as const satisfies ElementType[];

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

	if (!(allowedNodeType as readonly string[]).includes(type)) {
		throw new MdastSemanticError(`Invalid node type: ${type}`);
	}

	switch (type) {
		case "markdown":
			return [
				{
					type: "root",
					children: mapChildren(children, rootContentTypes),
				} satisfies mdast.Root,
			];
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
			return transformOrderedListNode(element);
		case "ol":
			return transformUnorderedListNode(element);
		case "li":
			return transformListItemNode(element);

		case "blockquote":
			return transformBlockquoteNode(element);

		default:
			throw new Error(`Unknown type: ${type}`);
	}
};

export const mapChildren = <T extends keyof ElementTypeToMdastNodeMap>(
	children: IntrinsicsNode[],
	allowedNodeType: readonly T[],
): ElementTypeToMdastNodeMap[T][] => {
	return children
		.flatMap((child) => transformNode(child, allowedNodeType))
		.filter(excludeNullish) as ElementTypeToMdastNodeMap[T][];
};
