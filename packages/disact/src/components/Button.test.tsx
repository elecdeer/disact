import { describe, expect, it } from "vitest";
import { renderToInstance } from "../reconciler/render.js";
import { Button, buttonElementSchema } from "./Button.js";

describe("Button", () => {
  it("should render a primary button with custom ID", async () => {
    const result = await renderToInstance(
      <Button style="primary" customId="test-button">
        Click me
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2, // ComponentType.Button
      style: 1, // ButtonStyle.Primary
      custom_id: "test-button",
      label: "Click me",
    });
  });

  it("should render a secondary button", async () => {
    const result = await renderToInstance(
      <Button style="secondary" customId="secondary-btn">
        Secondary
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 2, // ButtonStyle.Secondary
      custom_id: "secondary-btn",
      label: "Secondary",
    });
  });

  it("should render a link button with URL", async () => {
    const result = await renderToInstance(
      <Button style="link" url="https://example.com">
        Visit
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 5, // ButtonStyle.Link
      url: "https://example.com",
      label: "Visit",
    });
  });

  it("should render a premium button with SKU ID", async () => {
    const result = await renderToInstance(
      <Button style="premium" skuId="123456789">
        Premium
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 6, // ButtonStyle.Premium
      sku_id: "123456789",
      label: "Premium",
    });
  });

  it("should render a disabled button", async () => {
    const result = await renderToInstance(
      <Button style="primary" customId="disabled-btn" disabled>
        Disabled
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 1,
      custom_id: "disabled-btn",
      disabled: true,
      label: "Disabled",
    });
  });

  it("should render a button with optional ID", async () => {
    const result = await renderToInstance(
      <Button style="success" customId="success-btn" id={42}>
        Success
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 3, // ButtonStyle.Success
      custom_id: "success-btn",
      id: 42,
      label: "Success",
    });
  });

  it("should render a danger button", async () => {
    const result = await renderToInstance(
      <Button style="danger" customId="danger-btn">
        Delete
      </Button>,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 4, // ButtonStyle.Danger
      custom_id: "danger-btn",
      label: "Delete",
    });
  });

  it("should render a button without children", async () => {
    const result = await renderToInstance(
      <Button style="primary" customId="no-label" />,
    );

    expect(result).toHaveLength(1);

    const parsed = buttonElementSchema.safeParse(result[0]);
    expect.assert(parsed.success);
    expect(parsed.data).toMatchObject({
      type: 2,
      style: 1,
      custom_id: "no-label",
    });
    // @ts-expect-error
    expect(parsed.data.label).toBeUndefined();
  });
});
