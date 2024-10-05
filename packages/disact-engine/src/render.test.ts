import { describe, expect, test } from "vitest";
import {
	createElementInternal,
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
				{
					type: "li",
					children: "one",
				},
				{
					type: "li",
					children: "two",
				},
				{
					type: "li",
					children: "three",
				},
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
});
