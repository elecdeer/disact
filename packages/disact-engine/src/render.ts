import {
	type DisactElement,
	isFunctionComponentElement,
	type IntrinsicElementsKey,
	contextSymbol,
	type IntrinsicElementDisactElement,
	isFragmentElement,
	type DisactNode,
} from "./element";

export type RenderedDisactElement =
	| IntrinsicElementDisactElement
	| string
	| undefined
	| null;

export const render = async (
	element: DisactElement,
): Promise<RenderedDisactElement> => {
	const result = await renderElement(element);
	if (Array.isArray(result)) {
		throw new Error("Top level element must not be Fragment");
	}
	return result;
};

const renderElement = async (
	node: DisactElement | string | undefined | null,
	combinedContextRunner: <T>(cb: () => T) => T = (cb) => cb(),
): Promise<RenderedDisactElement | RenderedDisactElement[]> => {
	if (node === null || node === undefined || typeof node === "string") {
		return node;
	}

	if (node.type === "Fragment") {
		return await renderChildren(node.children);
	}

	const context = contextSymbol in node ? node[contextSymbol] : undefined;

	const contextRunner = context
		? <T>(cb: () => T) => {
				return combinedContextRunner<T>(() => context(cb));
			}
		: combinedContextRunner;

	if (isFunctionComponentElement(node)) {
		const resolved = await contextRunner(async () =>
			node.type({
				...node.props,
				children: node.children,
			}),
		);
		return await renderElement(resolved, contextRunner);
	}

	return {
		...node,
		children: await renderChildren(node.children),
	};
};

const renderChildren = async (
	children: DisactNode | DisactNode[],
	combinedContextRunner: <T>(cb: () => T) => T = (cb) => cb(),
) => {
	if (Array.isArray(children)) {
		return await Promise.all(
			children.map((child) => renderElement(child, combinedContextRunner)),
		).then((children) => children.flat());
	}

	return await renderElement(children, combinedContextRunner);
};
