/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { DisactNode, FC } from "../element";

describe("Render Functions", () => {
  it("should handle component with renderContent-like function props", async () => {
    const Modal: FC<{
      title: string;
      renderContent: () => DisactNode;
      renderFooter?: () => DisactNode;
    }> = ({ title, renderContent, renderFooter }) => (
      <div className="modal">
        <header>{title}</header>
        <main>{renderContent()}</main>
        {renderFooter ? <footer>{renderFooter()}</footer> : null}
      </div>
    );

    const element = (
      <Modal
        title="Confirmation"
        renderContent={() => "Are you sure you want to continue?"}
        renderFooter={() => <button>OK</button>}
      />
    );

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "modal" },
      children: [
        {
          type: "intrinsic",
          name: "header",
          props: {},
          children: [{ type: "text", content: "Confirmation" }],
        },
        {
          type: "intrinsic",
          name: "main",
          props: {},
          children: [{ type: "text", content: "Are you sure you want to continue?" }],
        },
        {
          type: "intrinsic",
          name: "footer",
          props: {},
          children: [
            {
              type: "intrinsic",
              name: "button",
              props: {},
              children: [{ type: "text", content: "OK" }],
            },
          ],
        },
      ],
    });
  });
});
