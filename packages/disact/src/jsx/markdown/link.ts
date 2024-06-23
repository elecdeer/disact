import { mapChildren } from "./markdown";
import { toArray } from "../../util/toArray";
import type * as mdast from "mdast";
import { phrasingContentTypes, type IntrinsicsNode } from "./types";

export const transformLinkNode = (
	element: IntrinsicsNode<"a">,
): [mdast.Link] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "link",
			url: element.props.href,
			children: mapChildren(children, phrasingContentTypes),
		} satisfies mdast.Link,
	];
};
