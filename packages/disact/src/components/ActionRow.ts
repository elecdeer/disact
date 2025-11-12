import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import type { DisactNode } from "../types.js";
import { removeUndefined } from "../utils/removeUndefined";
import { buttonElementSchema } from "./Button";
import { channelSelectElementSchema } from "./ChannelSelect";
import { mentionableSelectElementSchema } from "./MentionableSelect";
import { roleSelectElementSchema } from "./RoleSelect";
import { stringSelectElementSchema } from "./StringSelect";
import { userSelectElementSchema } from "./UserSelect";

export type ActionRowElement = {
  id?: number;
  children: DisactNode;
};

export const actionRowInMessageElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("actionRow"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
    }),
    children: z
      .array(
        z.discriminatedUnion("name", [
          buttonElementSchema,
          stringSelectElementSchema,
          userSelectElementSchema,
          roleSelectElementSchema,
          mentionableSelectElementSchema,
          channelSelectElementSchema,
        ]),
      )
      .min(1)
      .max(5),
  })
  .transform(
    (obj): APIActionRowComponent<APIComponentInMessageActionRow> =>
      removeUndefined({
        type: ComponentType.ActionRow as const,
        id: obj.props.id,
        components: obj.children,
      }),
  );
