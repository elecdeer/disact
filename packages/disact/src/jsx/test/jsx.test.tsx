/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { Fragment } from "../..//jsx-runtime";

describe("jsx", () => {
	test("Function component", () => {
		const Component = (props: { name: string }) => {
			return <h1>{props.name}</h1>;
		};

		expect(<Component name="Hello" />).toEqual({
			_jsxType: Component,
			_props: { name: "Hello" },
		});
	});

	test("Function component returns not jsx element", () => {
		const Component = (props: { name: string }) => {
			return {
				name: `Hello, ${props.name}!`,
			};
		};

		expect(<Component name="World" />).toEqual({
			_jsxType: Component,
			_props: { name: "World" },
		});
	});

	test("Fragment", () => {
		expect(
			// biome-ignore lint/complexity/noUselessFragments: <explanation>
			<>Hello World</>,
		).toEqual({
			_jsxType: Fragment,
			_props: { children: "Hello World" },
		});
	});

	test("Nested", () => {
		expect(
			<ul>
				<li>one</li>
				<li>two</li>
				<li>three</li>
			</ul>,
		).toEqual({
			_jsxType: "ul",
			type: "ul",
			props: {
				children: [
					{ _jsxType: "li", type: "li", props: { children: "one" } },
					{ _jsxType: "li", type: "li", props: { children: "two" } },
					{ _jsxType: "li", type: "li", props: { children: "three" } },
				],
			},
		});
	});
});
