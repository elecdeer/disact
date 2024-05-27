/** @jsxImportSource ../../ */

import { createRenderer } from "../renderer";
import { Fragment, jsx, type JSX } from "../../jsx-runtime";
import { describe, expect, test } from "vitest";
import type { FunctionComponent } from "jsx/jsx-internal";

describe("jsx", () => {
	test("intrinsic", () => {
		expect(jsx("h1", { children: "Heading" }, undefined, true)).toEqual({
			_jsxType: "h1",
			type: "h1",
			children: [{ type: "text", value: "Heading" }],
		});

		expect(jsx("h2", { children: "Hello!" }, undefined, true)).toEqual({
			_jsxType: "h2",
			type: "h2",
			children: [{ type: "text", value: "Hello!" }],
		});
	});

	test("function", () => {
		const Component = (props: { name: string }) => {
			return jsx("h1", { children: props.name }, undefined, true);
		};

		expect(jsx(Component, { name: "Hello" }, undefined, true)).toEqual({
			_jsxType: Component,
			_props: { name: "Hello" },
		});
	});

	test("function returns not jsx element", () => {
		const Component = (props: { name: string }) => {
			return {
				name: `Hello, ${props.name}!`,
			};
		};

		expect(jsx(Component, { name: "World" }, undefined, true)).toEqual({
			_jsxType: Component,
			_props: { name: "World" },
		});
	});

	test("fragment", () => {
		expect(
			jsx(Fragment, { children: ["Hello", "World"] }, undefined, true),
		).toEqual({
			_jsxType: Fragment,
			_props: { children: ["Hello", "World"] },
		});
	});

	test("nested", () => {
		expect(
			jsx(
				"ul",
				{
					children: [
						jsx("li", { children: "one" }, undefined, true),
						jsx("li", { children: "two" }, undefined, true),
						jsx("li", { children: "three" }, undefined, true),
					],
				},
				undefined,
				false,
			),
		).toEqual({
			_jsxType: "ul",
			type: "ul",
			children: [
				{
					_jsxType: "li",
					type: "li",
					children: [{ type: "text", value: "one" }],
				},
				{
					_jsxType: "li",
					type: "li",
					children: [{ type: "text", value: "two" }],
				},
				{
					_jsxType: "li",
					type: "li",
					children: [{ type: "text", value: "three" }],
				},
			],

			// type: "list",
			// children: [
			// 	{
			// 		type: "listItem",
			// 		children: [
			// 			{ type: "paragraph", children: [{ type: "text", value: "one" }] },
			// 		],
			// 	},
			// 	{
			// 		type: "listItem",
			// 		children: [
			// 			{ type: "paragraph", children: [{ type: "text", value: "two" }] },
			// 		],
			// 	},
			// 	{
			// 		type: "listItem",
			// 		children: [
			// 			{ type: "paragraph", children: [{ type: "text", value: "three" }] },
			// 		],
			// 	},
			// ],
		});
	});
});

describe("render", () => {
	test("intrinsic only", async () => {
		const render = createRenderer({});

		expect(
			await render(jsx("h1", { children: "Heading" }, undefined, true)),
		).toEqual({
			type: "h1",
			children: [{ type: "text", value: "Heading" }],
		});
	});

	test("functional component", async () => {
		const Component = (props: { name: string }) => {
			return jsx("h1", { children: props.name }, undefined, true);
		};

		const render = createRenderer({});

		expect(
			await render(jsx(Component, { name: "Hello" }, undefined, true)),
		).toEqual({
			type: "h1",
			children: [{ type: "text", value: "Hello" }],
		});
	});

	test("async functional component", async () => {
		const Component = async (props: { name: string }) => {
			return jsx("h1", { children: props.name }, undefined, true);
		};

		const render = createRenderer({});

		expect(
			await render(jsx(Component, { name: "Hello" }, undefined, true)),
		).toEqual({
			type: "h1",
			children: [{ type: "text", value: "Hello" }],
		});
	});

	test("nested fc", async () => {
		const ListItem = (props: { children: JSX.Element }) => {
			return jsx("li", { children: props.children }, undefined, true);
		};

		const List = (props: { children: JSX.Element[] }) => {
			return jsx(
				"ul",
				{
					children: props.children,
				},
				undefined,
				true,
			);
		};

		const render = createRenderer({});

		expect(
			await render(
				jsx(
					List,
					{
						children: ["one", "two", "three"].map((item) =>
							jsx(ListItem, { children: item }, undefined, true),
						),
					},
					undefined,
					true,
				),
			),
		).toEqual({
			type: "ul",
			children: [
				{ type: "li", children: [{ type: "text", value: "one" }] },
				{ type: "li", children: [{ type: "text", value: "two" }] },
				{ type: "li", children: [{ type: "text", value: "three" }] },
			],
		});
	});

	// JSXはstringを返してはいけない
	// test("nested fc 2", async () => {
	// 	const TopBottomWrapper = ({
	// 		slot,
	// 	}: {
	// 		slot: JSX.Element;
	// 	}) => {
	// 		return jsx("p", { children: `===\n${slot}\n===` }, undefined, true);
	// 	};

	// 	const LeftRightWrapper = ({
	// 		slot,
	// 	}: {
	// 		slot: JSX.Element;
	// 	}) => {
	// 		return `|| ${slot} ||`;
	// 	};

	// 	const render = createRenderer({});

	// 	expect(
	// 		await render(
	// 			jsx(
	// 				TopBottomWrapper,
	// 				{
	// 					slot: jsx(
	// 						LeftRightWrapper,
	// 						{
	// 							slot: "Hello",
	// 						},
	// 						undefined,
	// 						true,
	// 					),
	// 				},
	// 				undefined,
	// 				true,
	// 			),
	// 		),
	// 	).toEqual({
	// 		type: "p",
	// 		children: [{ type: "text", value: "===\n|| Hello ||\n===" }],
	// 	});
	// });

	test("nested fc 3", async () => {
		const FooBar = async (props: {
			slot: JSX.Element;
		}) => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return {
				foo: "foo",
				bar: {
					slot: props.slot,
				},
			};
		};

		const render = createRenderer({});

		// オブジェクト返すやつもJSXで構築するか、JSONで返ってきたやつからJSX Elementを探してrenderするか

		expect(
			await render(
				jsx(
					FooBar,
					{
						slot: jsx(FooBar, { slot: "Hello" }, undefined, true),
					},
					undefined,
					true,
				),
			),
		).toEqual({
			foo: "foo",
			bar: {
				slot: {
					foo: "foo",
					bar: {
						slot: "Hello",
					},
				},
			},
		});
	});

	test("Fragment", async () => {
		const render = createRenderer({});

		expect(
			await render(
				jsx(Fragment, { children: ["Hello", "World"] }, undefined, true),
			),
		).toEqual(["Hello", "World"]);
	});

	test("Component can return null", () => {
		const Component: FunctionComponent = () => null;

		const render = createRenderer({});

		expect(render(jsx(Component, {}, undefined, true))).resolves.toBeNull();
	});
});
