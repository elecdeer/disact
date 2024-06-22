import type {
	DisactChildElement,
	DisactChildElements,
	DisactChildNodes,
	DisactJSXElement,
	FunctionComponent,
} from "./jsx-internal";

import { toMarkdown } from "mdast-util-to-markdown";
import { gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import type * as mdast from "mdast";

export const mdastToMarkdown = (root: mdast.Root): string => {
	return toMarkdown(root, {
		extensions: [gfmStrikethroughToMarkdown()],
	});
};

const toArray = <T>(value: T | T[]): T[] => {
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

const rootContentTypes = [
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

const phrasingContentTypes = [
	"br", // break
	"s", // delete
	"i", // emphasis
	"code", // inlineCode
	"a", // link
	"b", // strong
	"text", // text
] as const satisfies ElementType[];

const blockContentTypes = [
	"blockquote", // blockquote
	"pre", // code
	"h1", // heading
	"h2", // heading
	"h3", // heading
	"ol", // list
	"ul", // list
	"p", // paragraph
] as const satisfies ElementType[];

class MdastSemanticError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MdastSemanticError";
	}
}

const transformNode = <T extends keyof ElementTypeToMdastNodeMap>(
	element: IntrinsicsNode | string,
	allowedNodeType: T[],
): (ElementTypeToMdastNodeMap[T] | null)[] => {
	if (typeof element === "string") {
		return [
			{
				type: "text",
				value: element,
			} satisfies mdast.Text as ElementTypeToMdastNodeMap[T],
		];
	}

	const { type, props } = element;
	const children = toArray(props?.children ?? []);

	if (!(allowedNodeType as string[]).includes(type)) {
		throw new MdastSemanticError(`Invalid node type: ${type}`);
	}

	switch (type) {
		case "markdown":
			return [
				{
					type: "root",
					children: mapChildren(children, rootContentTypes),
				} satisfies mdast.Root as ElementTypeToMdastNodeMap[T],
			];
		case "h1":
			return [
				{
					type: "heading",
					depth: 1,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Heading as ElementTypeToMdastNodeMap[T],
			];
		case "h2":
			return [
				{
					type: "heading",
					depth: 2,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Heading as ElementTypeToMdastNodeMap[T],
			];
		case "h3":
			return [
				{
					type: "heading",
					depth: 3,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Heading as ElementTypeToMdastNodeMap[T],
			];
		case "p":
			return [
				{
					type: "paragraph",
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Paragraph as ElementTypeToMdastNodeMap[T],
			];
		case "br":
			return [
				{
					type: "break",
				} satisfies mdast.Break as ElementTypeToMdastNodeMap[T],
			];
		case "a":
			return [
				{
					type: "link",
					url: (props as IntrinsicsNode<"a">["props"]).href,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Link as ElementTypeToMdastNodeMap[T],
			];
		case "i":
			return [
				{
					type: "emphasis",
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Emphasis as ElementTypeToMdastNodeMap[T],
			];
		case "b":
			return [
				{
					type: "strong",
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Strong as ElementTypeToMdastNodeMap[T],
			];
		case "s":
			return [
				{
					type: "delete",
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Delete as ElementTypeToMdastNodeMap[T],
			];
		// case "u":
		//   return {
		//     type: "underline",
		//     children,
		//   } as mdast.Underline;
		case "code":
			return [
				{
					type: "inlineCode",
					value: mapChildren(children, ["text"])
						.map((child) => child?.value ?? "")
						.join(""),
				} satisfies mdast.InlineCode as ElementTypeToMdastNodeMap[T],
			];
		case "pre":
			return [
				{
					type: "code",
					lang: (props as IntrinsicsNode<"pre">["props"]).lang,
					value: mapChildren(children, ["text"])
						.map((child) => child?.value ?? "")
						.join(""),
				} satisfies mdast.Code as ElementTypeToMdastNodeMap[T],
			];
		case "ul":
			return [
				{
					type: "list",
					ordered: false,
					spread: false,
					children: mapChildren(children, ["li"]),
				} satisfies mdast.List as ElementTypeToMdastNodeMap[T],
			];
		case "ol":
			return [
				{
					type: "list",
					ordered: true,
					spread: false,
					start: (props as IntrinsicsNode<"ol">["props"]).start,
					children: mapChildren(children, ["li"]),
				} satisfies mdast.List as ElementTypeToMdastNodeMap[T],
			];
		case "li":
			return [
				{
					type: "listItem",
					spread: false,
					children: mapChildren(children, [...blockContentTypes, "text"]).map(
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
				} satisfies mdast.ListItem as ElementTypeToMdastNodeMap[T],
			];

		case "blockquote":
			return [
				{
					type: "blockquote",
					children: mapChildren(children, blockContentTypes),
				} satisfies mdast.Blockquote as ElementTypeToMdastNodeMap[T],
			];

		default:
			throw new Error(`Unknown type: ${type}`);
	}
};

const mapChildren = <T extends keyof ElementTypeToMdastNodeMap>(
	children: IntrinsicsNode[],
	allowedNodeType: T[],
): ElementTypeToMdastNodeMap[T][] => {
	return children
		.flatMap((child) => transformNode(child, allowedNodeType))
		.filter(excludeNullish);
};
