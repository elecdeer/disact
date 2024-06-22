import {
	mapChildren,
	phrasingContentTypes,
	toArray,
	type IntrinsicsNode,
} from "./index";

import type * as mdast from "mdast";

export const transformParagraphNode = (
	element: IntrinsicsNode<"p">,
): [mdast.Paragraph] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "paragraph",
			children: mapChildren(children, phrasingContentTypes),
		} satisfies mdast.Paragraph,
	];
};
