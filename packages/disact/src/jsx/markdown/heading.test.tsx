/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("heading 1", () => {
	test("jsx", () => {
		expect(<h1>Hello</h1>).toEqual({
			_jsxType: "h1",
			type: "h1",
			props: {
				children: "Hello",
			},
		});
	});

	test("rendered", async () => {
		const render = createRenderer({});

		expect(
			await render(
				<markdown>
					<h1>Hello</h1>
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "# Hello
      "
    `);
	});
});

describe("heading 2", () => {
	test("jsx", () => {
		expect(<h2>Hello</h2>).toEqual({
			_jsxType: "h2",
			type: "h2",
			props: {
				children: "Hello",
			},
		});
	});

	test("rendered", async () => {
		const render = createRenderer({});

		expect(
			await render(
				<markdown>
					<h2>Hello</h2>
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "## Hello
      "
    `);
	});
});

describe("heading 3", () => {
	test("jsx", () => {
		expect(<h3>Hello</h3>).toEqual({
			_jsxType: "h3",
			type: "h3",
			props: {
				children: "Hello",
			},
		});
	});

	test("rendered", async () => {
		const render = createRenderer({});

		expect(
			await render(
				<markdown>
					<h3>Hello</h3>
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "### Hello
      "
    `);
	});
});
