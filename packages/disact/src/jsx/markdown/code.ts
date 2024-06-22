import { mapChildren, toArray, type IntrinsicsNode } from ".";
import type * as mdast from "mdast";

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
