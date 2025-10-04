/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("blockquote", () => {
  test("jsx", () => {
    expect(
      <blockquote>
        <p>Hello</p>
      </blockquote>,
    ).toEqual({
      _jsxType: "blockquote",
      type: "blockquote",
      props: {
        children: {
          _jsxType: "p",
          type: "p",
          props: {
            children: "Hello",
          },
        },
      },
    });
  });

  test("rendered", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <markdown>
          <blockquote>
            <p>Hello</p>
          </blockquote>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"> Hello
			"
		`);
  });
});
