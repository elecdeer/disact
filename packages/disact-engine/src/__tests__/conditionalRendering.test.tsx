/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { FC } from "../element";

describe("Conditional Rendering and Dynamic Behavior", () => {
  it("should handle component with conditional rendering based on props", async () => {
    const ConditionalComponent: FC<{
      type: "button" | "link";
      text: string;
      href?: string;
    }> = ({ type, text, href }) => {
      if (type === "button") {
        return <button>{text}</button>;
      }
      return <a href={href}>{text}</a>;
    };

    // Test button variant
    const buttonElement = <ConditionalComponent type="button" text="Click me" />;

    const stream1 = renderToReadableStream(buttonElement, {});
    const chunks1 = await readStreamToCompletion(stream1);
    expect(chunks1).toHaveLength(1);
    expect(chunks1[0]).toEqual({
      type: "intrinsic",
      name: "button",
      props: {},
      children: [{ type: "text", content: "Click me" }],
    });

    // Test link variant
    const linkElement = <ConditionalComponent type="link" text="Go to page" href="/page" />;

    const stream2 = renderToReadableStream(linkElement, {});
    const chunks2 = await readStreamToCompletion(stream2);
    expect(chunks2).toHaveLength(1);
    expect(chunks2[0]).toEqual({
      type: "intrinsic",
      name: "a",
      props: { href: "/page" },
      children: [{ type: "text", content: "Go to page" }],
    });
  });

  it("should handle component with different structures based on props", async () => {
    const StatusComponent: FC<{
      status: "loading" | "success" | "error";
      message?: string;
    }> = ({ status, message }) => {
      switch (status) {
        case "loading":
          return <div className="loading">Loading...</div>;
        case "success":
          return (
            <div className="success">
              <span>✓</span>
              {message || "Success"}
            </div>
          );
        case "error":
          return (
            <div className="error">
              <strong>{message || "Error occurred"}</strong>
            </div>
          );
      }
    };

    // Test success status
    const successElement = <StatusComponent status="success" message="Data saved" />;

    const stream = renderToReadableStream(successElement, {});
    const chunks = await readStreamToCompletion(stream);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "success" },
      children: [
        {
          type: "intrinsic",
          name: "span",
          props: {},
          children: [{ type: "text", content: "✓" }],
        },
        { type: "text", content: "Data saved" },
      ],
    });
  });

  it("should handle component with array children manipulation", async () => {
    const ListComponent: FC<{
      items: string[];
      ordered?: boolean;
    }> = ({ items, ordered = false }) => {
      const Tag = ordered ? "ol" : "ul";
      return (
        <Tag>
          {items.map((item) => (
            <li>{item}</li>
          ))}
        </Tag>
      );
    };

    const element = <ListComponent items={["Item 1", "Item 2", "Item 3"]} />;

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "ul",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "li",
          props: {},
          children: [{ type: "text", content: "Item 1" }],
        },
        {
          type: "intrinsic",
          name: "li",
          props: {},
          children: [{ type: "text", content: "Item 2" }],
        },
        {
          type: "intrinsic",
          name: "li",
          props: {},
          children: [{ type: "text", content: "Item 3" }],
        },
      ],
    });
  });
});
