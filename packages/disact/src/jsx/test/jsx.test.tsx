/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { Fragment } from "../..//jsx-runtime";

describe("jsx", () => {
	test("Intrinsic component", () => {
		expect(<h1>heading</h1>).toEqual({
			_jsxType: "h1",
			type: "h1",
			children: ["heading"],
		});

		expect(<h2>Hello!</h2>).toEqual({
			_jsxType: "h2",
			type: "h2",
			children: ["Hello!"],
		});
	});

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
			children: [
				{ _jsxType: "li", type: "li", children: ["one"] },
				{ _jsxType: "li", type: "li", children: ["two"] },
				{ _jsxType: "li", type: "li", children: ["three"] },
			],
		});
	});
});
