import type { DisactNode } from "@disact/engine";
import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { buttonElementSchema } from "./buttonElement";
import { channelSelectElementSchema } from "./channelSelectElement";
import { mentionableSelectElementSchema } from "./mentionableSelectElement";
import { roleSelectElementSchema } from "./roleSelectElement";
import { createNamedSlotSchema } from "./schemaUtils";
import { stringSelectElementSchema } from "./stringSelectElement";
import { userSelectElementSchema } from "./userSelectElement";

export type ActionRowElement = {
  id?: number;
  children: DisactNode;
};

export const actionRowInMessageElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("message-component"),
    props: z.object({
      type: z.literal(ComponentType.ActionRow),
      id: z.optional(z.number().int().min(0)),
    }),
    children: z
      .array(
        createNamedSlotSchema(
          "components",
          z.union([
            buttonElementSchema,
            stringSelectElementSchema,
            userSelectElementSchema,
            roleSelectElementSchema,
            mentionableSelectElementSchema,
            channelSelectElementSchema,
          ]),
          { min: 1, max: 5 },
        ),
      )
      .length(1),
  })
  .transform((obj): APIActionRowComponent<APIComponentInMessageActionRow> => {
    const components = obj.children[0]!.children;
    return removeUndefined({
      type: ComponentType.ActionRow as const,
      id: obj.props.id,
      components,
    });
  });
