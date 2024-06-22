import { mapChildren } from "./index";
import { toArray } from "../../util/toArray";
import type * as mdast from "mdast";
import { type IntrinsicsNode, phrasingContentTypes } from "./types";

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
