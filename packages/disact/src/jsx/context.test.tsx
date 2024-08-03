/** @jsxImportSource ../ */

import { describe, expect, test } from "vitest";
import { createContext, useContext } from "./context";
import { createRenderer } from "./renderer";
import type { FunctionComponent } from "./jsx-internal";

describe("context", () => {
	test("renders initial context value", async () => {
		const Context = createContext("initial");

		const Component = () => {
			const value = useContext<string>(Context);
			return <h1>{value}</h1>;
		};

		const render = createRenderer({});

		expect(await render(<Component />)).toEqual({
			type: "h1",
			props: {
				children: "initial",
			},
		});
	});

	test("renders wrapped context value", async () => {
		const Context = createContext("initial");

		const Component = () => {
			const value = useContext<string>(Context);
			return <h1>{value}</h1>;
		};

		const Wrapper = () => {
			return (
				<Context value="wrapped">
					<Component />
				</Context>
			);
		};

		const render = createRenderer({});
		expect(await render(<Wrapper />)).toEqual({
			type: "h1",
			props: {
				children: "wrapped",
			},
		});
	});

	test("renders multiple nested context values", async () => {
		const Context = createContext("initial");

		const Component = () => {
			const value = useContext<string>(Context);
			return <h1>{value}</h1>;
		};

		const Wrapper = () => {
			return (
				<>
					<Context value="AAA">
						<Component />
					</Context>
					<Context value="BBB">
						<Component />
						<Context value="CCC">
							<Component />
						</Context>
					</Context>
				</>
			);
		};

		const render = createRenderer({});
		expect(await render(<Wrapper />)).toEqual([
			{
				props: { children: "AAA" },
				type: "h1",
			},
			[
				{
					props: { children: "BBB" },
					type: "h1",
				},
				{
					props: { children: "CCC" },
					type: "h1",
				},
			],
		]);
	});

	test("renders context values with async components", async () => {
		const Context = createContext("initial");

		const contextReferenceOrder: string[] = [];

		const Component: FunctionComponent<{
			wait?: number;
			id: string;
		}> = async ({ wait = 0, id }) => {
			await new Promise((resolve) => setTimeout(resolve, wait));
			contextReferenceOrder.push(id);
			const value = useContext<string>(Context);
			return <h1>{value}</h1>;
		};

		const Wrapper = () => {
			return (
				<>
					<Context value="AAA">
						<Component id={"A"} wait={50} />
					</Context>
					<Context value="BBB">
						<Component id={"B"} wait={20} />
						<Context value="CCC">
							<Component id={"C"} />
						</Context>
					</Context>
				</>
			);
		};

		const render = createRenderer({});

		expect(await render(<Wrapper />)).toEqual([
			{ props: { children: "AAA" }, type: "h1" },
			[
				{ props: { children: "BBB" }, type: "h1" },
				{ props: { children: "CCC" }, type: "h1" },
			],
		]);

		expect(contextReferenceOrder).toEqual(["C", "B", "A"]);
	});

	test("use multiple contexts", async () => {
		const ContextA = createContext("A");
		const ContextB = createContext("B");

		const Component = () => {
			const valueA = useContext<string>(ContextA);
			const valueB = useContext<string>(ContextB);
			return (
				<>
					<h1>{valueA}</h1>
					<h2>{valueB}</h2>
				</>
			);
		};

		const Wrapper = () => {
			return (
				<ContextA value="AAA">
					<ContextB value="BBB">
						<Component />
					</ContextB>
				</ContextA>
			);
		};

		const render = createRenderer({});

		expect(await render(<Wrapper />)).toEqual([
			{ props: { children: "AAA" }, type: "h1" },
			{ props: { children: "BBB" }, type: "h2" },
		]);
	});
});
