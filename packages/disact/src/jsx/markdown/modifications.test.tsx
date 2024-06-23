/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("emphasis", () => {
	test("jsx", () => {
		expect(<i>Hello</i>).toEqual({
			_jsxType: "i",
			type: "i",
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
					<i>Hello</i>
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "*Hello*
      "
    `);
	});
});

describe("strong", () => {
	test("jsx", () => {
		expect(<b>Hello</b>).toEqual({
			_jsxType: "b",
			type: "b",
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
					<b>Hello</b>
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "**Hello**
      "
    `);
	});
});

describe("delete", () => {
	test("jsx", () => {
		expect(<s>Hello</s>).toEqual({
			_jsxType: "s",
			type: "s",
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
					<s>Hello</s>
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "~~Hello~~
      "
    `);
	});
});
