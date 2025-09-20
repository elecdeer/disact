import type { JSX } from "../jsx-runtime";
import {
  type FunctionComponent,
  isDisactElement,
  type PropType,
} from "./jsx-internal";
import {
  mdastToMarkdown,
  transformToMdast,
  traverseMarkdown,
} from "./markdown";

export type RendererConfig = {
  // TODO:
  foo?: unknown;
};

export const createRenderer = (_config: RendererConfig) => {
  const traverseElementAndRender = async (
    obj: object,
    combinedContextRunner: <T>(cb: () => T) => T = (cb) => cb(),
  ): Promise<object> => {
    // biome-ignore lint/suspicious/noExplicitAny: 必要
    const result: { [key: string]: any } = Array.isArray(obj) ? [] : {};
    const promises: Promise<void>[] = [];

    const renderChildElement = async (
      componentFunc: FunctionComponent,
      props: PropType,
    ) => {
      const resolved = await combinedContextRunner(async () => {
        return await componentFunc(props);
      });

      if (resolved === null || resolved === undefined) {
        return resolved;
      }

      const context = "_context" in resolved ? resolved._context : undefined;
      const contextRunner = context
        ? <T>(cb: () => T) => {
            return combinedContextRunner<T>(() => context(cb));
          }
        : combinedContextRunner;
      return traverseElementAndRender(resolved, contextRunner);
    };

    if (isDisactElement(obj) && typeof obj._jsxType === "function") {
      return renderChildElement(obj._jsxType, obj._props);
    }

    for (const key in obj) {
      if (!Object.hasOwn(obj, key)) continue;

      const value = obj[key as keyof typeof obj] as unknown;
      if (isDisactElement(value) && typeof value._jsxType === "function") {
        promises.push(
          Promise.resolve(
            renderChildElement(value._jsxType, value._props),
          ).then((resolved) => {
            if (resolved !== undefined) {
              result[key] = resolved;
            }
          }),
        );
      } else if (typeof value === "object" && value !== null) {
        promises.push(
          Promise.resolve(
            traverseElementAndRender(value, combinedContextRunner),
          ).then((resolved) => {
            if (resolved !== undefined) {
              result[key] = resolved;
            }
          }),
        );
      } else {
        result[key] = value;
      }
    }

    await Promise.all(promises);

    // TODO: 削除しなくてもよい？
    if ("_jsxType" in obj) {
      delete result._jsxType;
    }

    return result;
  };

  const render = async (
    element: JSX.Element,
  ): Promise<object | string | undefined | null> => {
    const result = await traverseElementAndRender(element);

    return traverseMarkdown(result, (node) => {
      const mdast = transformToMdast(node);
      return mdastToMarkdown(mdast);
    });
  };

  return render;
};
