import { mapChildren } from "./index";
import { toArray } from "../../util/toArray";
import type * as mdast from "mdast";
import { type IntrinsicsNode, blockContentTypes } from "./types";

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
