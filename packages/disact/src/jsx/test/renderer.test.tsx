/** @jsxImportSource ../../ */

import type { DisactChildElement, DisactChildElements } from "jsx/jsx-internal";
import type { JSX } from "../..//jsx-runtime";
import { createRenderer } from "../renderer";
import { describe, expect, test } from "vitest";

describe("renderer", () => {
	test("Intrinsic component", async () => {
		const render = createRenderer({});

		expect(await render(<h1>Heading</h1>)).toEqual({
			type: "h1",
			props: {
				children: "Heading",
			},
		});
	});

	test("Function component", async () => {
		const Component = (props: { name: string }) => {
			return <h1>{props.name}</h1>;
		};

		const render = createRenderer({});

		expect(await render(<Component name="Hello" />)).toEqual({
			type: "h1",
			props: {
				children: "Hello",
			},
		});
	});

	test("Async function component", async () => {
		const Component = async (props: { name: string }) => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return <h1>{props.name}</h1>;
		};

		const render = createRenderer({});

		expect(await render(<Component name="Hello" />)).toEqual({
			type: "h1",
			props: { children: "Hello" },
		});
	});

	test("Nested Function component", async () => {
		const ListItem = (props: { children: DisactChildElements }) => {
			return <li>{props.children}</li>;
		};

		const List = (props: { children: DisactChildElements }) => {
			return <ul>{props.children}</ul>;
		};

		const render = createRenderer({});

		expect(
			await render(
				<List>
					{["one", "two", "three"].map((item) => (
						// biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
						<ListItem>{item}</ListItem>
					))}
				</List>,
			),
		).toEqual({
			type: "ul",
			props: {
				children: [
					{ type: "li", props: { children: "one" } },
					{ type: "li", props: { children: "two" } },
					{ type: "li", props: { children: "three" } },
				],
			},
		});
	});

	test("Nested function component returns not jsx element", async () => {
		const FooBar = async (props: {
			slot: DisactChildElement;
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

		expect(await render(<FooBar slot={<FooBar slot="Hello" />} />)).toEqual({
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
				<>
					{"Hello"}
					{"World"}
				</>,
			),
		).toEqual(["Hello", "World"]);
	});

	test("Component can return null", async () => {
		const Component = () => {
			return null;
		};

		const render = createRenderer({});

		expect(await render(<Component />)).toEqual(null);
	});
});
