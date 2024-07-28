/** @jsxImportSource ../ */

import type {
	DisactJSX,
	DisactJSXElement,
	FunctionComponent,
} from "./jsx-internal";
import { AsyncLocalStorage } from "node:async_hooks";

export type Context<T> = FunctionComponent<{
	children: DisactJSX.Element | Promise<DisactJSX.Element>;
	value: T;
}> & {
	_defaultValue: T;
	_asyncLocalStorage: AsyncLocalStorage<T>;
};

export const createContext = <T,>(defaultValue: T): Context<T> => {
	const asyncLocalStorage = new AsyncLocalStorage<T>();

	const Provider: Context<T> = async ({ children, value }) => {
		const resolved = await children;

		const _context: DisactJSXElement["_context"] = (cb) => {
			return asyncLocalStorage.run(value, cb);
		};

		return Object.assign(resolved, {
			_context,
		});
	};

	Provider._defaultValue = defaultValue;
	Provider._asyncLocalStorage = asyncLocalStorage;

	return Provider;
};

export const useContext = <T,>(context: Context<T>): T => {
	const value = context._asyncLocalStorage.getStore();
	console.log("get", value);

	if (value === undefined) {
		return context._defaultValue;
	}

	return value;
};
