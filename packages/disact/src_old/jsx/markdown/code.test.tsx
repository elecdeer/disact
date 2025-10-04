/** @jsxImportSource ../../ */

import { dedent } from "ts-dedent";
import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("code", () => {
  test("jsx", () => {
    expect(<code>const a = 1;</code>).toEqual({
      _jsxType: "code",
      type: "code",
      props: {
        children: "const a = 1;",
      },
    });
  });

  test("rendered", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <markdown>
          <code>const a = 1;</code>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"\`const a = 1;\`
			"
		`);
  });
});

describe("code block", () => {
  test("jsx", () => {
    expect(
      <code>
        {dedent`
          const a = 1;
          const b = 2;
        `}
      </code>,
    ).toEqual({
      _jsxType: "code",
      type: "code",
      props: {
        children: dedent`
          const a = 1;
          const b = 2;
        `,
      },
    });
  });

  test("rendered", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <markdown>
          <code>
            {dedent`
              const a = 1;
              const b = 2;
            `}
          </code>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"\`const a = 1;
			const b = 2;\`
			"
		`);
  });
});
