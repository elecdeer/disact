/** @jsxImportSource ../../ */

import { mdastToMarkdown, transformToMdast } from "../markdown";
import { describe, expect, test } from "vitest";

import { createRenderer } from "../renderer";

describe("markdown", () => {
	test("basic", async () => {
		const render = createRenderer({});

		const result = await render(
			<markdown>
				<p>Hello</p>
			</markdown>,
		);

		expect(result).toMatchObject({
			type: "markdown",
			props: {
				children: {
					type: "p",
					props: {
						children: "Hello",
					},
				},
			},
		});

		if (!result) return;
		const mdast = transformToMdast(result);
		expect(mdast).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "children": [
			        {
			          "type": "text",
			          "value": "Hello",
			        },
			      ],
			      "type": "paragraph",
			    },
			  ],
			  "type": "root",
			}
		`);

		expect(mdastToMarkdown(mdast)).toMatchInlineSnapshot(`
			"Hello
			"
		`);
	});

	test("a", async () => {
		const render = createRenderer({});

		const renderResult = await render(
			<markdown>
				<a href="https://example.com">example</a>
			</markdown>,
		);

		expect(renderResult).toMatchObject({
			type: "markdown",
			props: {
				children: {
					type: "a",
					props: {
						href: "https://example.com",
						children: "example",
					},
				},
			},
		});

		if (!renderResult) return;
		const mdast = transformToMdast(renderResult);
		expect(mdast).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "children": [
			        {
			          "type": "text",
			          "value": "example",
			        },
			      ],
			      "type": "link",
			      "url": "https://example.com",
			    },
			  ],
			  "type": "root",
			}
		`);

		expect(mdastToMarkdown(mdast)).toMatchInlineSnapshot(`
			"[example](https://example.com)
			"
		`);
	});

	test("ul", async () => {
		const render = createRenderer({});

		const renderResult = await render(
			<markdown>
				<ul>
					<li>one</li>
					<li>two</li>
					<li>three</li>
				</ul>
			</markdown>,
		);
		expect(renderResult).toMatchObject({
			type: "markdown",
			props: {
				children: {
					type: "ul",
					props: {
						children: [
							{
								type: "li",
								props: {
									children: "one",
								},
							},
							{
								type: "li",
								props: {
									children: "two",
								},
							},
							{
								type: "li",
								props: {
									children: "three",
								},
							},
						],
					},
				},
			},
		});

		if (!renderResult) return;
		const mdast = transformToMdast(renderResult);
		expect(mdast).toMatchInlineSnapshot(`
			{
			  "children": [
			    {
			      "children": [
			        {
			          "children": [
			            {
			              "children": [
			                {
			                  "type": "text",
			                  "value": "one",
			                },
			              ],
			              "type": "paragraph",
			            },
			          ],
			          "spread": false,
			          "type": "listItem",
			        },
			        {
			          "children": [
			            {
			              "children": [
			                {
			                  "type": "text",
			                  "value": "two",
			                },
			              ],
			              "type": "paragraph",
			            },
			          ],
			          "spread": false,
			          "type": "listItem",
			        },
			        {
			          "children": [
			            {
			              "children": [
			                {
			                  "type": "text",
			                  "value": "three",
			                },
			              ],
			              "type": "paragraph",
			            },
			          ],
			          "spread": false,
			          "type": "listItem",
			        },
			      ],
			      "ordered": false,
			      "spread": false,
			      "type": "list",
			    },
			  ],
			  "type": "root",
			}
		`);

		expect(mdastToMarkdown(mdast)).toMatchInlineSnapshot(`
			"* one
			* two
			* three
			"
		`);
	});
});
