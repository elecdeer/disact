/** @jsxImportSource ../../ */

import { describe, expect, test, vi } from "vitest";
import { traverseMarkdown } from "./markdown";

describe("markdown", () => {
  describe("traverseMarkdown", () => {
    test("traverse", () => {
      const element = {
        type: "hoge",
        rows: [
          {
            type: "markdown",
            props: {
              children: [
                {
                  type: "p",
                  props: {
                    children: "Hello",
                  },
                },
              ],
            },
          },
        ],
      };

      const transform = vi.fn((_value) => {
        return {
          type: "transformed",
        };
      });

      const result = traverseMarkdown(element, transform);

      expect(transform).toHaveBeenCalledWith({
        type: "markdown",
        props: {
          children: [
            {
              type: "p",
              props: {
                children: "Hello",
              },
            },
          ],
        },
      });

      expect(result).toMatchObject({
        type: "hoge",
        rows: [
          {
            type: "transformed",
          },
        ],
      });
    });
  });
});
