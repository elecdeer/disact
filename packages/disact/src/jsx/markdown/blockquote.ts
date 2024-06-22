import {
	blockContentTypes,
	mapChildren,
	toArray,
	type IntrinsicsNode,
} from ".";
import type * as mdast from "mdast";

export const transformBlockquoteNode = (
	element: IntrinsicsNode<"blockquote">,
): [mdast.Blockquote] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "blockquote",
			children: mapChildren(children, blockContentTypes),
		} satisfies mdast.Blockquote,
	];
};
