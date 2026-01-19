/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { DisactElement, DisactNode } from "../element";
import { Fragment } from "../jsx-dev-runtime";

describe("Fragment Pattern", () => {
  it("should handle Fragment as children in intrinsic element", async () => {
    const containerElement = (
      <div className="container">
        <Fragment>
          <h2>Title</h2>
          <p>Content goes here</p>
          <button>Action</button>
        </Fragment>
      </div>
    );

    const stream = renderToReadableStream(containerElement, {});
    const chunks = await readStreamToCompletion(stream);
    expect(chunks).toHaveLength(1);
    const result = chunks[0];

    expect(result).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "container" },
      children: [
        {
          type: "intrinsic",
          name: "h2",
          props: {},
          children: [{ type: "text", content: "Title" }],
        },
        {
          type: "intrinsic",
          name: "p",
          props: {},
          children: [{ type: "text", content: "Content goes here" }],
        },
        {
          type: "intrinsic",
          name: "button",
          props: {},
          children: [{ type: "text", content: "Action" }],
        },
      ],
    });
  });

  it("should handle nested Fragment pattern", async () => {
    const Fragment = ({ children }: { children: DisactElement[] }): DisactNode => children;

    const containerElement = (
      <article>
        <Fragment>
          <header>
            <Fragment>
              <h1>Main Title</h1>
              <p>Subtitle</p>
            </Fragment>
          </header>
          <main>Main content</main>
        </Fragment>
      </article>
    );

    const stream = renderToReadableStream(containerElement, {});
    const chunks = await readStreamToCompletion(stream);
    expect(chunks).toHaveLength(1);
    const result = chunks[0];

    expect(result).toEqual({
      type: "intrinsic",
      name: "article",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "header",
          props: {},
          children: [
            {
              type: "intrinsic",
              name: "h1",
              props: {},
              children: [{ type: "text", content: "Main Title" }],
            },
            {
              type: "intrinsic",
              name: "p",
              props: {},
              children: [{ type: "text", content: "Subtitle" }],
            },
          ],
        },
        {
          type: "intrinsic",
          name: "main",
          props: {},
          children: [{ type: "text", content: "Main content" }],
        },
      ],
    });
  });
});
