export namespace DisactJSX {
	export type Element = DisactJSXElement | DisactObjectElement;

	export interface IntrinsicElements {
		h1: { children?: DisactJSXElementNode };
		h2: { children?: DisactJSXElementNode };
		h3: { children?: DisactJSXElementNode };

		p: { children?: DisactJSXElementNode };
		br: { children?: never };
		a: { href: string; children?: DisactJSXElementNode };

		i: { children?: DisactJSXElementNode };
		b: { children?: DisactJSXElementNode };
		s: { children?: DisactJSXElementNode };
		u: { children?: DisactJSXElementNode };

		code: { children: DisactJSXElementNode };
		pre: { lang?: string; children: DisactJSXElementNode };

		ul: { children?: DisactJSXElementNode };
		ol: { children?: DisactJSXElementNode; start?: number };
		li: { children?: DisactJSXElementNode };

		blockquote: { children?: DisactJSXElementNode };

		// time: {
		//   unixtime: number;
		//   children: never;
		//   format?: "f" | "F" | "d" | "t" | "D" | "T" | "R";
		// };

		// user: { id: string; children: never };
		// channel: { id: string; children: never };
		// role: { id: string; children: never };

		// guildNav: {
		//   type: "customize" | "browse" | "guide";
		//   children: never;
		// };

		// slashCommand: {
		//   name: string;
		//   id: string;
		//   children: never;
		// };

		// emoji: {
		//   name: string;
		//   id: string;
		//   animated?: boolean;
		//   children: never;
		// };

		// spoiler: AnyObject;
	}

	export interface ElementChildrenAttribute {
		children?: unknown;
	}
}

export type DisactJSXElement = {
	_jsxType: FunctionComponent | string;
	_props: PropType;

	[key: string]: unknown;
};

export type DisactJSXElementNode =
	| DisactJSXElement
	| string
	| number
	| boolean
	| null
	| undefined;

export type DisactObjectElement = object | null | undefined;

export type PropType = Record<string | number | symbol, unknown>;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type FunctionComponent<P extends PropType = any> = (
	props: P,
) => DisactJSX.Element | Promise<DisactJSX.Element>;

type JsxDevSource = {
	fileName: string;
	lineNumber: number;
	columnNumber: number;
};

const toArray = <T>(value: T | T[]): T[] => {
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
};

export const jsx = (
	type: FunctionComponent | keyof DisactJSX.IntrinsicElements,
	props: Record<string, unknown> & {
		children?: (string | unknown)[];
	},
	_key: unknown,
	__isStaticChildren: boolean | undefined,
	source: JsxDevSource | undefined,
): DisactJSX.Element => {
	if (typeof type === "function") {
		return {
			_jsxType: type,
			_props: props,
		};
	}

	const children = props.children
		? toArray(props.children).map((child) => {
				if (typeof child === "string") {
					return {
						type: "text",
						value: child,
					};
				}
				return child;
			})
		: [];

	return {
		_jsxType: type,
		type,
		children,
	};
};

export const jsxs = jsx;

export const FragmentInternal = ({
	children,
}: {
	children: DisactJSX.Element[];
}) => ([] as DisactJSX.Element[]).concat(children);

export const isDisactElement = (
	element: unknown,
): element is DisactJSXElement => {
	return (
		typeof element === "object" &&
		element !== null &&
		element !== undefined &&
		"_jsxType" in element
	);
};
