import type { IntrinsicsNode } from "./index";
import type * as mdast from "mdast";

export const transformBreakNode = (
	element: IntrinsicsNode<"br">,
): [mdast.Break] => {
	return [
		{
			type: "break",
		} satisfies mdast.Break,
	];
};
