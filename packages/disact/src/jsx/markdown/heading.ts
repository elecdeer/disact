import { mapChildren, MdastSemanticError } from "./markdown";
import { toArray } from "../../util/toArray";

import type * as mdast from "mdast";
import { type IntrinsicsNode, phrasingContentTypes } from "./types";

export const transformHeadingNode = (
	element: IntrinsicsNode<"h1" | "h2" | "h3">,
): [mdast.Heading] => {
	const children = toArray(element.props.children ?? []);

	switch (element.type) {
		case "h1":
			return [
				{
					type: "heading",
					depth: 1,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Heading,
			];
		case "h2":
			return [
				{
					type: "heading",
					depth: 2,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Heading,
			];
		case "h3":
			return [
				{
					type: "heading",
					depth: 3,
					children: mapChildren(children, phrasingContentTypes),
				} satisfies mdast.Heading,
			];
	}

	throw new MdastSemanticError(`Invalid node type: ${element.type}`);
};
