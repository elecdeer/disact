import { describe, expect, test } from "vitest";
import { createContext, useContext } from "./context";
import { createElementInternal, type FunctionComponent } from "./element";
import { render } from "./render";

describe("context", () => {
  test("Contexts act like Fragments", async () => {
    const Context = createContext("initial");

    const Component = () => {
      return useContext(Context);
    };

    const Wrapper = () => {
      return createElementInternal({
        type: "div",
        children: createElementInternal({
          type: Context,
          props: { value: "wrapped" },
          children: [
            createElementInternal({ type: Component }),
            createElementInternal({
              type: Context,
              props: { value: "nested" },
              children: [
                createElementInternal({ type: Component }),
                createElementInternal({
                  type: Context,
                  props: { value: "deep" },
                }),
              ],
            }),
            createElementInternal({ type: Component }),
          ],
        }),
      });
    };

    expect(
      await render(
        createElementInternal({
          type: Wrapper,
        }),
      ),
    ).toMatchObject({
      type: "div",
      children: ["wrapped", "nested", undefined, "wrapped"],
    });
  });

  test("renders initial context value", async () => {
    const Context = createContext("initial");

    const Component = () => {
      const value = useContext(Context);
      return createElementInternal({
        type: "h1",
        props: {},
        children: value,
      });
    };

    expect(
      await render(
        createElementInternal({
          type: Component,
        }),
      ),
    ).toMatchObject({
      type: "h1",
      children: "initial",
    });
  });

  test("renders wrapped context value", async () => {
    const Context = createContext("initial");

    const Component = () => {
      const value = useContext(Context);
      return createElementInternal({
        type: "h1",
        props: {},
        children: value,
      });
    };

    const Wrapper = () => {
      return createElementInternal({
        type: Context,
        props: { value: "wrapped" },
        children: createElementInternal({
          type: Component,
        }),
      });
    };

    expect(
      await render(
        createElementInternal({
          type: Wrapper,
        }),
      ),
    ).toMatchObject({
      type: "h1",
      children: "wrapped",
    });
  });

  test("renders multiple nested context values", async () => {
    const Context = createContext("initial");

    const Component = () => {
      const value = useContext(Context);
      return createElementInternal({
        type: "h1",
        children: value,
      });
    };

    const Wrapper = () => {
      return createElementInternal({
        type: "div",
        children: [
          createElementInternal({
            type: Context,
            props: { value: "AAA" },
            children: createElementInternal({
              type: Component,
            }),
          }),
          createElementInternal({
            type: Context,
            props: { value: "BBB" },
            children: [
              createElementInternal({
                type: Component,
              }),
              createElementInternal({
                type: Context,
                props: { value: "CCC" },
                children: createElementInternal({
                  type: Component,
                }),
              }),
            ],
          }),
        ],
      });
    };

    expect(
      await render(
        createElementInternal({
          type: Wrapper,
        }),
      ),
    ).toMatchObject({
      type: "div",
      children: [
        {
          type: "h1",
          children: "AAA",
        },
        {
          type: "h1",
          children: "BBB",
        },
        {
          type: "h1",
          children: "CCC",
        },
      ],
    });
  });

  test("renders multiple nested context values", async () => {
    const Context = createContext("initial");

    const contextReferenceOrder: string[] = [];

    const Component: FunctionComponent<{
      wait?: number;
      id: string;
    }> = async ({ wait = 0, id }) => {
      await new Promise((resolve) => setTimeout(resolve, wait));
      contextReferenceOrder.push(id);
      const value = useContext<string>(Context);

      return createElementInternal({
        type: "h1",
        children: value,
      });
    };

    const Wrapper: FunctionComponent = () => {
      return createElementInternal({
        type: "div",
        children: [
          createElementInternal({
            type: Context,
            props: { value: "AAA" },
            children: createElementInternal({
              type: Component,
              props: { id: "A", wait: 50 },
            }),
          }),
          createElementInternal({
            type: Context,
            props: { value: "BBB" },
            children: [
              createElementInternal({
                type: Component,
                props: { id: "B", wait: 20 },
              }),
              createElementInternal({
                type: Context,
                props: { value: "CCC" },
                children: createElementInternal({
                  type: Component,
                  props: { id: "C" },
                }),
              }),
            ],
          }),
        ],
      });
    };

    const result = await render(
      createElementInternal({
        type: Wrapper,
      }),
    );

    expect(result).toMatchObject({
      type: "div",
      children: [
        {
          type: "h1",
          children: "AAA",
        },
        {
          type: "h1",
          children: "BBB",
        },
        {
          type: "h1",
          children: "CCC",
        },
      ],
    });

    expect(contextReferenceOrder).toEqual(["C", "B", "A"]);
  });

  test("use multiple contexts", async () => {
    const ContextA = createContext("A");
    const ContextB = createContext("B");

    const Component = () => {
      const valueA = useContext<string>(ContextA);
      const valueB = useContext<string>(ContextB);
      return createElementInternal({
        type: "div",
        children: [
          createElementInternal({
            type: "h1",
            children: valueA,
          }),
          createElementInternal({
            type: "h2",
            children: valueB,
          }),
        ],
      });
    };

    const Wrapper = () => {
      return createElementInternal({
        type: ContextA,
        props: { value: "AAA" },
        children: createElementInternal({
          type: ContextB,
          props: { value: "BBB" },
          children: createElementInternal({
            type: Component,
          }),
        }),
      });
    };

    expect(
      await render(
        createElementInternal({
          type: Wrapper,
        }),
      ),
    ).toMatchObject({
      type: "div",
      children: [
        {
          type: "h1",
          children: "AAA",
        },
        {
          type: "h2",
          children: "BBB",
        },
      ],
    });
  });
});
