/** @jsxImportSource . */

import { describe, expect, it } from "vitest";
import { testRender } from "./testing";

describe("test", () => {
  it("render", async () => {
    const name = "alice";
    const Component = () => {
      return (
        <container>
          <actionRow>
            <button style="primary">Click me</button>
          </actionRow>
          <textDisplay>hello {name}</textDisplay>
        </container>
      );
    };

    const { result } = await testRender(<Component />);

    expect(result.current).toMatchInlineSnapshot(`
      [
        {
          "accent_color": undefined,
          "components": [
            {
              "components": [
                {
                  "custom_id": undefined,
                  "disabled": false,
                  "id": undefined,
                  "label": "Click me",
                  "style": 1,
                  "type": 2,
                },
              ],
              "id": undefined,
              "type": 1,
            },
            {
              "content": "hello alice",
              "id": undefined,
              "type": 10,
            },
          ],
          "id": undefined,
          "spoiler": undefined,
          "type": 17,
        },
      ]
    `);
    expect(result.history).toHaveLength(1);
  });
});
