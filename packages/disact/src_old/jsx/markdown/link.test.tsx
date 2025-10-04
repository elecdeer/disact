/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("link", () => {
  test("jsx", () => {
    expect(<a href="https://example.com">Hello</a>).toEqual({
      _jsxType: "a",
      type: "a",
      props: {
        href: "https://example.com",
        children: "Hello",
      },
    });
  });

  test("rendered", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <markdown>
          <a href="https://example.com">Hello</a>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
      "[Hello](https://example.com)
      "
    `);
  });
});
