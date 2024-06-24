/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("user", () => {
	test("jsx", () => {
		expect(<user id="80351110224678912" />).toEqual({
			_jsxType: "user",
			type: "user",
			props: {
				id: "80351110224678912",
			},
		});
	});

	test("rendered", async () => {
		const render = createRenderer({});

		expect(
			await render(
				<markdown>
					<user id="80351110224678912" />
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "<@80351110224678912>
      "
    `);
	});
});

describe("channel", () => {
	test("jsx", () => {
		expect(<channel id="103735883630395392" />).toEqual({
			_jsxType: "channel",
			type: "channel",
			props: {
				id: "103735883630395392",
			},
		});
	});

	test("rendered", async () => {
		const render = createRenderer({});

		expect(
			await render(
				<markdown>
					<channel id="103735883630395392" />
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "<#103735883630395392>
      "
    `);
	});
});

describe("role", () => {
	test("jsx", () => {
		expect(<role id="165511591545143296" />).toEqual({
			_jsxType: "role",
			type: "role",
			props: {
				id: "165511591545143296",
			},
		});
	});

	test("rendered", async () => {
		const render = createRenderer({});

		expect(
			await render(
				<markdown>
					<role id="165511591545143296" />
				</markdown>,
			),
		).toMatchInlineSnapshot(`
      "<@&165511591545143296>
      "
    `);
	});
});
