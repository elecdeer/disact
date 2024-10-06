import { describe, expect, test } from "vitest";
import {
	createElementInternal,
	createFragmentInternal,
	type DisactElement,
	type FunctionComponent,
} from "./element";
import { render } from "./render";

describe("render()", () => {
	test("Function component", async () => {
		const Component: FunctionComponent<{
			name: string;
		}> = (props) => {
			return createElementInternal({
				type: "h1",
				props: {},
				children: [props.name],
			});
		};

		// <Component name="Hello" />
		const element: DisactElement = createElementInternal({
			type: Component,
			props: { name: "Hello" },
		});

		expect(await render(element)).toMatchObject({
			type: "h1",
			children: ["Hello"],
		});
	});

	test("Async function component", async () => {
		const Component: FunctionComponent<{
			name: string;
		}> = async (props) => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return createElementInternal({
				type: "h1",
				children: [props.name],
			});
		};

		// <Component name="Hello" />
		const element: DisactElement = createElementInternal({
			type: Component,
			props: { name: "bob" },
		});

		expect(await render(element)).toMatchObject({
			type: "h1",
			children: ["bob"],
		});
	});

	test("Nested Function component", async () => {
		const ListItem: FunctionComponent<{
			children: string;
		}> = (props) => {
			return createElementInternal({
				type: "li",
				children: props.children,
			});
		};

		const List: FunctionComponent<{
			children: DisactElement[];
		}> = (props) => {
			return createElementInternal({
				type: "ul",
				children: props.children,
			});
		};

		// <List>
		// 	<ListItem>one</ListItem>
		// 	<ListItem>two</ListItem>
		// 	<ListItem>three</ListItem>
		// </List>
		const element: DisactElement = createElementInternal({
			type: List,
			children: [
				createElementInternal({
					type: ListItem,
					children: "one",
				}),
				createElementInternal({
					type: ListItem,
					children: "two",
				}),
				createElementInternal({
					type: ListItem,
					children: "three",
				}),
			],
		});

		expect(await render(element)).toMatchObject({
			type: "ul",
			children: [
				{ type: "li", children: "one" },
				{ type: "li", children: "two" },
				{ type: "li", children: "three" },
			],
		});
	});

	test("Any nullish children are removed", async () => {
		const ListItem: FunctionComponent<{
			children: string;
		}> = (props) => {
			return createElementInternal({
				type: "li",
				children: props.children,
			});
		};

		const List: FunctionComponent<{
			children: DisactElement[];
		}> = (props) => {
			return createElementInternal({
				type: "ul",
				children: props.children,
			});
		};

		const NullComponent: FunctionComponent = () => null;

		const element: DisactElement = createElementInternal({
			type: List,
			children: [
				createElementInternal({ type: ListItem, children: "one" }),
				null,
				createElementInternal({ type: ListItem, children: "two" }),
				undefined,
				createElementInternal({ type: ListItem, children: null }),
				createElementInternal({ type: ListItem, children: undefined }),
				createElementInternal({
					type: ListItem,
					children: ["nested", null, undefined, "nested2"],
				}),
				createElementInternal({
					type: ListItem,
					children: ["nested3", undefined],
				}),
				createElementInternal({
					type: ListItem,
					children: [null, undefined],
				}),
				createElementInternal({ type: ListItem, children: "three" }),
				createElementInternal({ type: NullComponent }),
			],
		});

		expect(await render(element)).toMatchObject({
			type: "ul",
			children: [
				{ type: "li", children: "one" },
				{ type: "li", children: "two" },
				{ type: "li", children: undefined },
				{ type: "li", children: undefined },
				{ type: "li", children: ["nested", "nested2"] },
				{ type: "li", children: ["nested3"] },
				{ type: "li", children: undefined },
				{ type: "li", children: "three" },
			],
		});
	});

	test("Shallow nested Function component", async () => {
		const Foo: FunctionComponent<{
			children: DisactElement;
		}> = (props) => {
			return props.children;
		};

		const Bar: FunctionComponent<{
			children: DisactElement;
		}> = (props) => {
			return createElementInternal({
				type: "p",
				children: props.children,
			});
		};

		// <Foo>
		// 	<Bar>Tar</Bar>
		// </Foo>
		const element: DisactElement = createElementInternal({
			type: Foo,
			children: createElementInternal({
				type: Bar,
				children: "Tar",
			}),
		});

		expect(await render(element)).toMatchObject({
			type: "p",
			children: "Tar",
		});
	});

	test("Fragment", async () => {
		const element: DisactElement = createElementInternal({
			type: "div",
			children: createFragmentInternal({
				children: ["one", "two", "three"],
			}),
		});

		expect(await render(element)).toMatchObject({
			type: "div",
			children: ["one", "two", "three"],
		});
	});

	test("Fragment 2", async () => {
		const element = createElementInternal({
			type: "root",
			children: createFragmentInternal({
				children: [
					createElementInternal({ type: "div", children: "oneNested" }),
					"two",
					createFragmentInternal({ children: ["threeInsideFragment"] }),
				],
			}),
		});

		expect(await render(element)).toMatchObject({
			type: "root",
			children: [
				{
					type: "div",
					children: "oneNested",
				},
				"two",
				"threeInsideFragment",
			],
		});
	});

	test("Component can return null", async () => {
		const Component: FunctionComponent = () => null;

		const element: DisactElement = createElementInternal({
			type: Component,
		});

		expect(await render(element)).toBeNull();
	});

	test("Component can return undefined", async () => {
		const Component: FunctionComponent = () => undefined;

		const element: DisactElement = createElementInternal({
			type: Component,
		});

		expect(await render(element)).toBeUndefined();
	});

	test("Components are rendered in order from parent to child", async () => {
		const result: string[] = [];

		const Component: FunctionComponent<{
			children: DisactElement[];
			id: string;
		}> = ({ children, id }) => {
			result.push(id);
			return createFragmentInternal({
				children,
			});
		};

		const element: DisactElement = createElementInternal({
			type: "root",
			children: createElementInternal({
				type: Component,
				props: {
					id: "parent",
				},
				children: [
					createElementInternal({
						type: Component,
						props: { id: "child1" },
						children: [
							createElementInternal({
								type: Component,
								props: { id: "child3" },
							}),
							createElementInternal({
								type: Component,
								props: { id: "child4" },
								children: createElementInternal({
									type: Component,
									props: { id: "child8" },
								}),
							}),
							createElementInternal({
								type: Component,
								props: { id: "child5" },
							}),
						],
					}),

					createElementInternal({
						type: Component,
						props: { id: "child2" },
						children: [
							createElementInternal({
								type: Component,
								props: { id: "child6" },
							}),
							createElementInternal({
								type: Component,
								props: { id: "child7" },
							}),
						],
					}),
				],
			}),
		});

		await render(element);

		expect(result).toEqual([
			"parent",
			"child1",
			"child2",
			"child3",
			"child4",
			"child5",
			"child6",
			"child7",
			"child8",
		]);
	});
});
