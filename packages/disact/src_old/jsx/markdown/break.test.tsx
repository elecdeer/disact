/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("break", () => {
  test("jsx", () => {
    expect(<br />).toEqual({
      _jsxType: "br",
      type: "br",
      props: {},
    });
  });

  test("rendered", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <markdown>
          <br />
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"\\
			"
		`);
  });
});
