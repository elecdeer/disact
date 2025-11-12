import { jsx } from "disact/jsx-runtime";
import { describe, expect, it } from "vitest";

describe("test", () => {
  it("createElement", () => {
    console.log(
      <div>
        {"Hello"}
        {"world"}
      </div>,
    );
    expect(jsx("div", {}, void 0, "Hello")).toMatchInlineSnapshot(`<div />`);
  });

  // it("render", async () => {
  //   const name = "alice";
  //   const Component = () => {
  //     return (
  //       <container>
  //         <actionRow>
  //           <button style="primary">Click me</button>
  //         </actionRow>
  //         <textDisplay>hello {name}</textDisplay>
  //       </container>
  //     );
  //   };

  //   const { result } = await testRender(<Component />);

  //   expect(result.current).toMatchInlineSnapshot(`
  //     [
  //       {
  //         "components": [
  //           {
  //             "components": [
  //               {
  //                 "disabled": false,
  //                 "label": "Click me",
  //                 "style": 1,
  //                 "type": 2,
  //               },
  //             ],
  //             "type": 1,
  //           },
  //           {
  //             "content": "hello alice",
  //             "type": 10,
  //           },
  //         ],
  //         "type": 17,
  //       },
  //     ]
  //   `);
  //   expect(result.history).toHaveLength(1);
  // });

  // it("render with Suspense", async () => {
  //   const { promise, resolve } = Promise.withResolvers<string>();

  //   const AsyncData = () => {
  //     const data = use(promise);
  //     return <textDisplay>{data}</textDisplay>;
  //   };

  //   const Component = () => {
  //     return (
  //       <container>
  //         <Suspense fallback={<textDisplay>Loading...</textDisplay>}>
  //           <AsyncData />
  //         </Suspense>
  //       </container>
  //     );
  //   };

  //   // testRenderを開始（この時点ではPromiseは未解決）
  //   const { result } = await testRender(<Component />);

  //   // 最初は fallback が表示される
  //   expect(result.current).toMatchInlineSnapshot(`
  //     [
  //       {
  //         "components": [
  //           {
  //             "content": "Loading...",
  //             "type": 10,
  //           },
  //         ],
  //         "type": 17,
  //       },
  //     ]
  //   `);

  //   // Promiseを解決してデータをロード
  //   resolve("Loaded data");
  //   await waitFor(() => {
  //     if (result.history.length !== 2) {
  //       throw new Error("Not yet loaded");
  //     }
  //   });

  //   // 非同期処理が完了すると実際のコンテンツが表示される
  //   expect(result.current).toMatchInlineSnapshot(`
  //     [
  //       {
  //         "components": [
  //           {
  //             "content": "Loaded data",
  //             "type": 10,
  //           },
  //         ],
  //         "type": 17,
  //       },
  //     ]
  //   `);

  //   // 2回レンダリングされる（fallback + 完了後）
  //   expect(result.history).toHaveLength(2);
  // });
});
