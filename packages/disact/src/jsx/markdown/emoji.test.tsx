/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("emoji", () => {
	describe("static", () => {
		test("jsx", () => {
			expect(<emoji name="mmLol" id="216154654256398347" />).toEqual({
				_jsxType: "emoji",
				type: "emoji",
				props: {
					name: "mmLol",
					id: "216154654256398347",
				},
			});
		});

		test("rendered", async () => {
			const render = createRenderer({});

			expect(
				await render(
					<markdown>
						<emoji name="mmLol" id="216154654256398347" />
					</markdown>,
				),
			).toMatchInlineSnapshot(`
        "<:mmLol:216154654256398347>
        "
      `);
		});
	});

	describe("animated", () => {
		test("jsx", () => {
			expect(<emoji name="b1nzy" id="392938283556143104" animated />).toEqual({
				_jsxType: "emoji",
				type: "emoji",
				props: {
					name: "b1nzy",
					id: "392938283556143104",
					animated: true,
				},
			});
		});

		test("rendered", async () => {
			const render = createRenderer({});

			expect(
				await render(
					<markdown>
						<emoji name="b1nzy" id="392938283556143104" animated />
					</markdown>,
				),
			).toMatchInlineSnapshot(`
        "<a:b1nzy:392938283556143104>
        "
      `);
		});
	});
});
