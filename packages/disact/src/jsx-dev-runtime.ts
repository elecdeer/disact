import type { DisactJSX, FunctionComponent } from "./jsx/jsx-internal";

import { FragmentInternal, jsx, jsxs } from "./jsx/jsx-internal";

export const jsxDEV = (
	type: FunctionComponent | keyof DisactJSX.IntrinsicElements,
	props: Record<string, unknown>,
	_key: unknown,
	__isStaticChildren: boolean,
): DisactJSX.Element => {
	return jsx(type, props, _key, __isStaticChildren, undefined);
};

export const jsxsDEV = (
	type: FunctionComponent | keyof DisactJSX.IntrinsicElements,
	props: Record<string, unknown>,
	_key: unknown,
	__isStaticChildren: boolean,
): DisactJSX.Element => {
	return jsxs(type, props, _key, __isStaticChildren, undefined);
};

export const Fragment = FragmentInternal;

export namespace JSX {
	export type Element = DisactJSX.Element;

	export interface IntrinsicElements extends DisactJSX.IntrinsicElements {}

	export interface ElementChildrenAttribute
		extends DisactJSX.ElementChildrenAttribute {}
}
