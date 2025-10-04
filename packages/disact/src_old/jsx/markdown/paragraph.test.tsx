/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { Fragment } from "../..//jsx-runtime";
import { createRenderer } from "../renderer";

describe("paragraph", () => {
  test("jsx", () => {
    expect(
      <>
        <p>Hello</p>
        <p>World</p>
      </>,
    ).toEqual({
      _jsxType: Fragment,
      _props: {
        children: [
          { _jsxType: "p", type: "p", props: { children: "Hello" } },
          { _jsxType: "p", type: "p", props: { children: "World" } },
        ],
      },
    });
  });

  test("rendered", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <markdown>
          <p>Hello</p>
          <p>World</p>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"Hello

			World
			"
		`);
  });
});
