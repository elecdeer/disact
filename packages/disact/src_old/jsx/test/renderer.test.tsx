/** @jsxImportSource ../../ */

import type { DisactChildElement, DisactChildElements, FunctionComponent } from "jsx/jsx-internal";
import { describe, expect, test } from "vitest";
import { createRenderer } from "../renderer";

describe("renderer", () => {
  test("Function component", async () => {
    const Component = (props: { name: string }) => {
      return <h1>{props.name}</h1>;
    };

    const render = createRenderer({});

    expect(await render(<Component name="Hello" />)).toEqual({
      type: "h1",
      props: {
        children: "Hello",
      },
    });
  });

  test("Async function component", async () => {
    const Component = async (props: { name: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return <h1>{props.name}</h1>;
    };

    const render = createRenderer({});

    expect(await render(<Component name="Hello" />)).toEqual({
      type: "h1",
      props: { children: "Hello" },
    });
  });

  test("Nested Function component", async () => {
    const ListItem = (props: { children: DisactChildElements }) => {
      return <li>{props.children}</li>;
    };

    const List = (props: { children: DisactChildElements }) => {
      return <ul>{props.children}</ul>;
    };

    const render = createRenderer({});

    expect(
      await render(
        <List>
          {["one", "two", "three"].map((item) => (
            <ListItem>{item}</ListItem>
          ))}
        </List>,
      ),
    ).toEqual({
      type: "ul",
      props: {
        children: [
          { type: "li", props: { children: "one" } },
          { type: "li", props: { children: "two" } },
          { type: "li", props: { children: "three" } },
        ],
      },
    });
  });

  test("Shallow nested Function component", async () => {
    const Foo = (props: { children: DisactChildElements }) => {
      return <>{props.children}</>;
    };

    const Bar = (props: { children: DisactChildElements }) => {
      return <p>{props.children}</p>;
    };

    const render = createRenderer({});

    expect(
      await render(
        <Foo>
          <Bar>Tar</Bar>
        </Foo>,
      ),
    ).toEqual([
      {
        type: "p",
        props: {
          children: "Tar",
        },
      },
    ]);
  });

  test("Nested function component returns not jsx element", async () => {
    const FooBar = async (props: { slot: DisactChildElement }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        foo: "foo",
        bar: {
          slot: props.slot,
        },
      };
    };

    const render = createRenderer({});

    // オブジェクト返すやつもJSXで構築するか、JSONで返ってきたやつからJSX Elementを探してrenderするか

    expect(await render(<FooBar slot={<FooBar slot="Hello" />} />)).toEqual({
      foo: "foo",
      bar: {
        slot: {
          foo: "foo",
          bar: {
            slot: "Hello",
          },
        },
      },
    });
  });

  test("Fragment", async () => {
    const render = createRenderer({});

    expect(
      await render(
        <>
          {"Hello"}
          {"World"}
        </>,
      ),
    ).toEqual(["Hello", "World"]);
  });

  test("Component can return null", async () => {
    const Component = () => {
      return null;
    };

    const render = createRenderer({});

    expect(await render(<Component />)).toEqual(null);
  });

  test("Components are rendered in order from parent to child", async () => {
    const render = createRenderer({});

    const result: string[] = [];

    const Component: FunctionComponent<{
      children?: DisactChildElements;
      id: string;
    }> = ({ children, id }) => {
      result.push(id);
      return <>{children}</>;
    };

    await render(
      <Component id="1">
        <Component id="2" />
        <Component id="3">
          <Component id="5" />
          <Component id="6">
            <Component id="9" />
          </Component>
        </Component>
        <Component id="4">
          <Component id="7" />
          <Component id="8" />
        </Component>
      </Component>,
    );

    expect(result).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });
});
