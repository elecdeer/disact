import type { JSX } from "../jsx-runtime";
import { isDisactElement } from "./jsx-internal";

export type RendererConfig = {
	// TODO:
	foo?: unknown;
};

export const createRenderer = (config: RendererConfig) => {
	const traverseElementAndRender = async (obj: object): Promise<object> => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const result: { [key: string]: any } = Array.isArray(obj) ? [] : {};
		const promises: Promise<void>[] = [];

		for (const key in obj) {
			if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

			const value = obj[key as keyof typeof obj] as unknown;
			if (isDisactElement(value) && typeof value._jsxType === "function") {
				promises.push(
					Promise.resolve(value._jsxType(value._props))
						.then((resolved) => {
							if (resolved === null || resolved === undefined) {
								return resolved;
							}
							return traverseElementAndRender(resolved);
						})
						.then((resolved) => {
							if (resolved !== undefined) {
								result[key] = resolved;
							}
						}),
				);
			} else if (typeof value === "object" && value !== null) {
				promises.push(
					Promise.resolve(traverseElementAndRender(value)).then((resolved) => {
						if (resolved !== undefined) {
							result[key] = resolved;
						}
					}),
				);
			} else {
				result[key] = value;
			}
		}

		await Promise.all(promises);

		// TODO: 削除しなくてもよい？
		if ("_jsxType" in obj) {
			// biome-ignore lint/performance/noDelete: <explanation>
			delete result._jsxType;
		}

		return result;
	};

	const render = async (
		element: JSX.Element,
	): Promise<object | undefined | null> => {
		const rendered =
			isDisactElement(element) && typeof element._jsxType === "function"
				? await element._jsxType(element._props)
				: element;

		if (rendered === null || rendered === undefined) {
			return rendered;
		}
		return traverseElementAndRender(rendered);
	};

	return render;
};

const renderIntrinsicElement = async () => {};
