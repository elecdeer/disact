/** @jsxImportSource ../../ */

import { test, describe, expect } from "vitest";

describe.skip("Intrinsic Elements", () => {
	test("heading", () => {
		expect(<h1>Heading</h1>).toMatchInlineSnapshot(`
			{
			  "_meta": {
			    "source": undefined,
			  },
			  "_props": {
			    "children": [
			      {
			        "_props": {
			          "children": [],
			          "value": "H1",
			        },
			        "_type": "$text",
			      },
			    ],
			  },
			  "_type": "h1",
			}
		`);
	});

	test("p", () => {
		expect(<p>Paragraph</p>).toMatchInlineSnapshot(`
			{
			  "_meta": {
			    "source": undefined,
			  },
			  "_props": {
			    "children": [
			      {
			        "_props": {
			          "children": [],
			          "value": "P",
			        },
			        "_type": "$text",
			      },
			    ],
			  },
			  "_type": "p",
			}
		`);
	});
});
