import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../../utils/removeUndefined";
import { buttonElementSchema } from "../Button/buttonSchema";
import { channelSelectElementSchema } from "../ChannelSelect/channelSelectSchema";
import { mentionableSelectElementSchema } from "../MentionableSelect/mentionableSelectSchema";
import { roleSelectElementSchema } from "../RoleSelect/roleSelectSchema";
import {
  createNamedSlotSchema,
  messageComponentElementSchema,
  requireSlotContent,
} from "../../elements/schemaUtils";
import { stringSelectElementSchema } from "../StringSelect/stringSelectSchema";
import { userSelectElementSchema } from "../UserSelect/userSelectSchema";

export const actionRowInMessageElementSchema = messageComponentElementSchema
  .extend({
    props: z.object({
      type: z.literal(ComponentType.ActionRow),
      id: z.optional(z.number().int().min(0)),
    }),
    children: z.array(
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
    ),
  })
  .transform((obj): APIActionRowComponent<APIComponentInMessageActionRow> => {
    const components = requireSlotContent(obj.children, "components");
    return removeUndefined({
      type: ComponentType.ActionRow as const,
      id: obj.props.id,
      components,
    });
  });
