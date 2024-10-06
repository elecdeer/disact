import {
	type FunctionComponent,
	type DisactElement,
	contextSymbol,
	createFragmentInternal,
} from "./element";
import { AsyncLocalStorage } from "node:async_hooks";

export type Context<T> = FunctionComponent<{
	children: DisactElement;
	value: T;
}> & {
	_defaultValue: T;
	_asyncLocalStorage: AsyncLocalStorage<T>;
};

export const createContext = <T>(defaultValue: T): Context<T> => {
	const asyncLocalStorage = new AsyncLocalStorage<T>();

	const Provider: Context<T> = ({ children, value }) => {
		const context: DisactElement[typeof contextSymbol] = (cb) => {
			return asyncLocalStorage.run(value, cb);
		};

		const element = createFragmentInternal({
			children,
		});
		element[contextSymbol] = context;

		return element;
	};

	Provider._defaultValue = defaultValue;
	Provider._asyncLocalStorage = asyncLocalStorage;

	return Provider;
};

export const useContext = <T>(context: Context<T>): T => {
	const value = context._asyncLocalStorage.getStore();

	if (value === undefined) {
		return context._defaultValue;
	}

	return value;
};
