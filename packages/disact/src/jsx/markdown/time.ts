import type { IntrinsicsNode } from "./types";

import type * as mdast from "mdast";

export const transformTimeNode = (
	element: IntrinsicsNode<"time">,
): [mdast.Html] => {
	// < をエスケープさせないためにmdast.Htmlを使用する

	if (element.props.format === undefined) {
		return [
			{
				type: "html",
				value: `<t:${element.props.unixtime}>`,
			} satisfies mdast.Html,
		];
	}

	return [
		{
			type: "html",
			value: `<t:${element.props.unixtime}:${element.props.format}>`,
		} satisfies mdast.Html,
	];
};
