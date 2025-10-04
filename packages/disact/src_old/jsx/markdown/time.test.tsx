/** @jsxImportSource ../../ */

import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("time", () => {
  describe("no format", () => {
    test("jsx", () => {
      expect(<time unixtime={1234567890} />).toEqual({
        _jsxType: "time",
        type: "time",
        props: {
          unixtime: 1234567890,
        },
      });
    });

    test("rendered", async () => {
      const render = createRenderer({});

      expect(
        await render(
          <markdown>
            <time unixtime={1234567890} />
          </markdown>,
        ),
      ).toMatchInlineSnapshot(`
				"<t:1234567890>
				"
			`);
    });
  });

  describe("with format", () => {
    test("jsx", () => {
      expect(
        <p>
          Departure:
          <time unixtime={1234567890} format="f" />
        </p>,
      ).toEqual({
        _jsxType: "p",
        type: "p",
        props: {
          children: [
            "Departure:",
            {
              _jsxType: "time",
              type: "time",
              props: {
                unixtime: 1234567890,
                format: "f",
              },
            },
          ],
        },
      });
    });

    test("rendered", async () => {
      const render = createRenderer({});

      expect(
        await render(
          <markdown>
            <p>
              Departure:
              <time unixtime={1234567890} format="f" />
            </p>
          </markdown>,
        ),
      ).toMatchInlineSnapshot(`
          "Departure:<t:1234567890:f>
          "
        `);
    });
  });
});
