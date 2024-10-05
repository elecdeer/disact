export type PropsBase = Record<PropertyKey, unknown>;

// biome-ignore lint/suspicious/noExplicitAny:
export type FunctionComponent<P extends PropsBase = any> = (
	props: P,
) => DisactNode | Promise<DisactNode>;

export type IntrinsicElementsKey = string;

export const contextSymbol = Symbol("context");
export const metaSymbol = Symbol("meta");

type DisactElementBase = {
	props: PropsBase;
	children: DisactNode | DisactNode[];
	[contextSymbol]?: (<T>(cb: () => T) => T) | undefined;
	[metaSymbol]?: Record<string, unknown>;
};

export type FunctionComponentDisactElement = {
	type: FunctionComponent;
} & DisactElementBase;

export type IntrinsicElementDisactElement = {
	type: IntrinsicElementsKey;
} & DisactElementBase;

export type FragmentDisactElement = {
	type: "Fragment";
} & DisactElementBase;

export type DisactElement =
	| FunctionComponentDisactElement
	| IntrinsicElementDisactElement
	| FragmentDisactElement;

export type DisactNode = DisactElement | string | undefined | null;

export type DevSource = {
	fileName: string;
	lineNumber: number;
	columnNumber: number;
};

export const createElementInternal = ({
	type,
	props,
	children,
	_devSource,
}: {
	type: IntrinsicElementsKey | FunctionComponent;
	props?: PropsBase;
	children?: DisactNode | DisactNode[];
	_devSource?: DevSource | undefined;
}): DisactElement => {
	if (typeof type === "string") {
		return {
			type,
			props: props ?? {},
			children,
			[metaSymbol]: _devSource,
		};
	}

	return {
		type,
		props: props ?? {},
		children,
		[metaSymbol]: _devSource,
	};
};

export const createFragmentInternal = ({
	children,
}: {
	children: DisactNode | DisactNode[];
}): DisactElement => {
	return createElementInternal({
		type: "Fragment",
		children,
	});
};

export const isDisactElement = (value: unknown): value is DisactElement => {
	return typeof value === "object" && value !== null && "type" in value;
};

export const isFunctionComponentElement = (
	value: DisactElement,
): value is FunctionComponentDisactElement => {
	return typeof value.type === "function";
};

export const isFragmentElement = (
	value: DisactElement,
): value is FragmentDisactElement => {
	return value.type === "Fragment";
};
