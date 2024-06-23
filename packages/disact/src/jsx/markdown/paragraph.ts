import { mapChildren } from "./markdown";
import { toArray } from "../../util/toArray";

import type * as mdast from "mdast";
import { type IntrinsicsNode, phrasingContentTypes } from "./types";

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
