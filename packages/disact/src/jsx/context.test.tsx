/** @jsxImportSource ../ */

import { describe, expect, test } from "vitest";
import { createContext, useContext } from "./context";
import { createRenderer } from "./renderer";

describe("context", () => {
	test("defaultValue", async () => {
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

	test("wrapped", async () => {
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

	test("separated", async () => {
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
});
