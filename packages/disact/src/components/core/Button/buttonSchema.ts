import { type APIButtonComponent, ButtonStyle, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../../utils/removeUndefined";
import { snowflakeSchema } from "../../../utils/snowflakeSchema";
import { createNamedSlotSchema, extractTextContent } from "../../elements/schemaUtils";

const textNodeSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
});

const buttonPropsSchema = z.discriminatedUnion("style", [
  z.object({
    type: z.literal(ComponentType.Button),
    id: z.optional(z.number().int()),
    disabled: z.optional(z.boolean().default(false)),
    style: z.union([
      z.literal("primary"),
      z.literal("secondary"),
      z.literal("success"),
      z.literal("danger"),
    ]),
    customId: z.string().max(100),
  }),
  z.object({
    type: z.literal(ComponentType.Button),
    id: z.optional(z.number().int()),
    disabled: z.optional(z.boolean().default(false)),
    style: z.literal("link"),
    url: z.url().max(512),
  }),
  z.object({
    type: z.literal(ComponentType.Button),
    id: z.optional(z.number().int()),
    disabled: z.optional(z.boolean().default(false)),
    style: z.literal("premium"),
    skuId: snowflakeSchema,
  }),
]);

export const buttonElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("message-component"),
    props: buttonPropsSchema,
    children: z.optional(z.array(createNamedSlotSchema("children", textNodeSchema)).length(1)),
  })
  .transform((obj): APIButtonComponent => {
    const label =
      obj.children && obj.children.length > 0
        ? extractTextContent(obj.children[0]!.children)
        : undefined;

    const shared = {
      type: ComponentType.Button as const,
      id: obj.props.id,
      disabled: obj.props.disabled,
      label,
    };

    switch (obj.props.style) {
      case "primary":
      case "secondary":
      case "success":
      case "danger": {
        const style =
          obj.props.style === "primary"
            ? ButtonStyle.Primary
            : obj.props.style === "secondary"
              ? ButtonStyle.Secondary
              : obj.props.style === "success"
                ? ButtonStyle.Success
                : ButtonStyle.Danger;
        return removeUndefined({
          ...shared,
          style: style as typeof ButtonStyle.Primary,
          custom_id: obj.props.customId,
        });
      }
      case "link":
        return removeUndefined({
          ...shared,
          style: ButtonStyle.Link as const,
          url: obj.props.url,
        });
      case "premium":
        return removeUndefined({
          ...shared,
          style: ButtonStyle.Premium as const,
          sku_id: obj.props.skuId,
        });
    }
  })
  .refine(
    (data) => {
      if ("label" in data && data.label !== undefined) {
        return data.label.length <= 80;
      }
      return true;
    },
    {
      message: "Label must be 80 characters or less",
    },
  );
