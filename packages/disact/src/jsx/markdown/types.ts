import type { DisactChildElements } from "../jsx-internal";
import type * as mdast from "mdast";

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
