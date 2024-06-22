import {
	mapChildren,
	phrasingContentTypes,
	toArray,
	type IntrinsicsNode,
} from ".";
import type * as mdast from "mdast";

export const transformEmphasisNode = (
	element: IntrinsicsNode<"i">,
): [mdast.Emphasis] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "emphasis",
			children: mapChildren(children, phrasingContentTypes),
		} satisfies mdast.Emphasis,
	];
};

export const transformStrongNode = (
	element: IntrinsicsNode<"b">,
): [mdast.Strong] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "strong",
			children: mapChildren(children, phrasingContentTypes),
		} satisfies mdast.Strong,
	];
};

export const transformDeleteNode = (
	element: IntrinsicsNode<"s">,
): [mdast.Delete] => {
	const children = toArray(element.props.children ?? []);

	return [
		{
			type: "delete",
			children: mapChildren(children, phrasingContentTypes),
		} satisfies mdast.Delete,
	];
};
