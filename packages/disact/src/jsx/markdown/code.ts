import { mapChildren } from "./index";
import { toArray } from "../../util/toArray";
import type * as mdast from "mdast";
import type { IntrinsicsNode } from "./types";

export const transformInlineCodeNode = (
	element: IntrinsicsNode<"code">,
): [mdast.InlineCode] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "inlineCode",
			value: mapChildren(children, ["text"]).join(""),
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
			value: mapChildren(children, ["text"]).join(""),
		} satisfies mdast.Code,
	];
};
