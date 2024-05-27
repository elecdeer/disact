import type { DisactJSX, FunctionComponent } from "./jsx/jsx-internal";

import {
	jsx as _jsx,
	jsxs as _jsxs,
	FragmentInternal,
} from "./jsx/jsx-internal";

export const jsx = (
	type: FunctionComponent | keyof DisactJSX.IntrinsicElements,
	props: Record<string, unknown>,
	_key: unknown,
	__isStaticChildren: boolean,
): DisactJSX.Element => {
	return _jsx(type, props, _key, __isStaticChildren, undefined);
};

export const jsxs = (
	type: FunctionComponent | keyof DisactJSX.IntrinsicElements,
	props: Record<string, unknown>,
	_key: unknown,
	__isStaticChildren: boolean,
): DisactJSX.Element => {
	return _jsxs(type, props, _key, __isStaticChildren, undefined);
};

export const Fragment = FragmentInternal;

export namespace JSX {
	export type Element = DisactJSX.Element;

	export interface IntrinsicElements extends DisactJSX.IntrinsicElements {}

	export interface ElementChildrenAttribute
		extends DisactJSX.ElementChildrenAttribute {}
}
