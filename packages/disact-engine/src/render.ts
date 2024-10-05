import {
	type DisactElement,
	isFunctionComponentElement,
	type IntrinsicElementsKey,
	contextSymbol,
	type IntrinsicElementDisactElement,
} from "./element";

export type RenderedDisactElement =
	| IntrinsicElementDisactElement
	| string
	| undefined
	| null;

export const render = async (
	element: DisactElement,
): Promise<RenderedDisactElement> => {
	return await renderElement(element);
};

const renderElement = async (
	node: DisactElement | string | undefined | null,
	combinedContextRunner: <T>(cb: () => T) => T = (cb) => cb(),
): Promise<RenderedDisactElement> => {
	if (node === null || node === undefined || typeof node === "string") {
		return node;
	}

	const context = contextSymbol in node ? node[contextSymbol] : undefined;

	const contextRunner = context
		? <T>(cb: () => T) => {
				return combinedContextRunner<T>(() => context(cb));
			}
		: combinedContextRunner;

	node.children = Array.isArray(node.children)
		? await Promise.all(
				node.children.map((child) => renderElement(child, contextRunner)),
			)
		: await renderElement(node.children, contextRunner);

	if (isFunctionComponentElement(node)) {
		const resolved = await contextRunner(async () =>
			node.type({
				...node.props,
				children: node.children,
			}),
		);
		return await renderElement(resolved, contextRunner);
	}
	return node;
};
