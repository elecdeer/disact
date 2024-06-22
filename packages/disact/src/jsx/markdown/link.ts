import {
	mapChildren,
	phrasingContentTypes,
	toArray,
	type IntrinsicsNode,
} from ".";
import type * as mdast from "mdast";

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
