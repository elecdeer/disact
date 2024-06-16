export namespace DisactJSX {
	export type Element = DisactElement;

	export interface IntrinsicElements {
		h1: { children?: DisactChildElements };
		h2: { children?: DisactChildElements };
		h3: { children?: DisactChildElements };

		p: { children?: DisactChildElements };
		br: { children?: never };
		a: { href: string; children?: DisactChildElements };

		i: { children?: DisactChildElements };
		b: { children?: DisactChildElements };
		s: { children?: DisactChildElements };
		u: { children?: DisactChildElements };

		code: { children: DisactChildElements };
		pre: { lang?: string; children: DisactChildElements };

		ul: { children?: DisactChildElements };
		ol: { children?: DisactChildElements; start?: number };
		li: { children?: DisactChildElements };

		blockquote: { children?: DisactChildElements };

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

export type DisactObjectElement = object;

export type DisactElement = DisactJSXElement | DisactObjectElement;

export type StringLike = {
	toString(): string;
};

export type DisactChildElement =
	| DisactElement
	| DisactFragment
	| string
	| StringLike
	| number
	| boolean
	| null
	| undefined;

export type DisactFragment = DisactChildElement[];

export type DisactChildElements = DisactChildElement | DisactChildElement[];

export type DisactChildNode = DisactElement | boolean | null | undefined;

export type DisactChildNodes = DisactChildNode | DisactChildNode[];

export type PropType = Record<PropertyKey, unknown>;
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

	const children = props.children ? toArray(props.children) : [];

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
