/** @jsxImportSource ../../ */
import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("ordered list", () => {
  test("jsx", () => {
    expect(
      <ol>
        <li>one</li>
        <li>two</li>
        <li>
          three
          <ol>
            <li>three-one</li>
            <li>three-two</li>
          </ol>
        </li>
      </ol>,
    ).toEqual({
      _jsxType: "ol",
      type: "ol",
      props: {
        children: [
          { _jsxType: "li", type: "li", props: { children: "one" } },
          { _jsxType: "li", type: "li", props: { children: "two" } },
          {
            _jsxType: "li",
            type: "li",
            props: {
              children: [
                "three",
                {
                  _jsxType: "ol",
                  type: "ol",
                  props: {
                    children: [
                      {
                        _jsxType: "li",
                        type: "li",
                        props: { children: "three-one" },
                      },
                      {
                        _jsxType: "li",
                        type: "li",
                        props: { children: "three-two" },
                      },
                    ],
                  },
                },
              ],
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
          <ol>
            <li>one</li>
            <li>two</li>
            <li>
              three
              <ol>
                <li>three-one</li>
                <li>three-two</li>
              </ol>
            </li>
          </ol>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"1. one
			2. two
			3. three
			   1. three-one
			   2. three-two
			"
		`);
  });
});

describe("unordered list", () => {
  test("jsx", () => {
    expect(
      <ul>
        <li>one</li>
        <li>two</li>
        <li>
          three
          <ul>
            <li>three-one</li>
            <li>three-two</li>
          </ul>
        </li>
      </ul>,
    ).toEqual({
      _jsxType: "ul",
      type: "ul",
      props: {
        children: [
          { _jsxType: "li", type: "li", props: { children: "one" } },
          { _jsxType: "li", type: "li", props: { children: "two" } },
          {
            _jsxType: "li",
            type: "li",
            props: {
              children: [
                "three",
                {
                  _jsxType: "ul",
                  type: "ul",
                  props: {
                    children: [
                      {
                        _jsxType: "li",
                        type: "li",
                        props: { children: "three-one" },
                      },
                      {
                        _jsxType: "li",
                        type: "li",
                        props: { children: "three-two" },
                      },
                    ],
                  },
                },
              ],
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
          <ul>
            <li>one</li>
            <li>two</li>
            <li>
              three
              <ul>
                <li>three-one</li>
                <li>three-two</li>
              </ul>
            </li>
          </ul>
        </markdown>,
      ),
    ).toMatchInlineSnapshot(`
			"* one
			* two
			* three
			  * three-one
			  * three-two
			"
		`);
  });
});
