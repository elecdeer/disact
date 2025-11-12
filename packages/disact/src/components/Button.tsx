import {
  type APIButtonComponent,
  ButtonStyle,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import type { DisactNode } from "../types.js";
import { removeUndefined } from "../utils/removeUndefined.js";
import { snowflakeSchema } from "../utils/snowflakeSchema.js";

export type ButtonProps = {
  id?: number;
  children?: DisactNode;
  disabled?: boolean;
} & (
  | { style: "primary" | "secondary" | "success" | "danger"; customId: string }
  | { style: "link"; url: string }
  | { style: "premium"; skuId: string }
);

/**
 * Button Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#button
 */
export const Button = ({ children, ...props }: ButtonProps) => {
  return <button {...props}>{children}</button>;
};

export const buttonElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("button"),
    props: z.discriminatedUnion("style", [
      z.object({
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
        id: z.optional(z.number().int()),
        disabled: z.optional(z.boolean().default(false)),
        style: z.literal("link"),
        url: z.url().max(512),
      }),
      z.object({
        id: z.optional(z.number().int()),
        disabled: z.optional(z.boolean().default(false)),
        style: z.literal("premium"),
        skuId: snowflakeSchema,
      }),
    ]),
    children: z
      .array(
        z.object({
          type: z.literal("text"),
          content: z.string(),
        }),
      )
      .transform((arr) =>
        arr.length > 0 ? arr.map((v) => v.content).join("") : undefined,
      )
      .optional(),
  })
  .transform((obj): APIButtonComponent => {
    const shared = {
      type: ComponentType.Button as const,
      id: obj.props.id,
      disabled: obj.props.disabled,
      label: obj.children || undefined,
    };
    switch (obj.props.style) {
      case "primary":
        return removeUndefined({
          ...shared,
          style: ButtonStyle.Primary as const,
          custom_id: obj.props.customId,
        });
      case "secondary":
        return removeUndefined({
          ...shared,
          style: ButtonStyle.Secondary as const,
          custom_id: obj.props.customId,
        });
      case "success":
        return removeUndefined({
          ...shared,
          style: ButtonStyle.Success as const,
          custom_id: obj.props.customId,
        });
      case "danger":
        return removeUndefined({
          ...shared,
          style: ButtonStyle.Danger as const,
          custom_id: obj.props.customId,
        });
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
  });
