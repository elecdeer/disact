import { type APIFileComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";

export type FileProps = {
  id?: number;
  spoiler?: boolean;
  file: {
    url: string;
  };
};

/**
 * File Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#file
 */
export const File = (props: FileProps) => {
  return <file {...props} />;
};

const unfurledMediaSchema = z.object({
  url: z.string().max(2048),
});

export const fileElementSchema = z
  .object({
    type: z.literal("file"),

    props: z.object({
      id: z.optional(z.number().int().min(0)),
      spoiler: z.optional(z.boolean()),
      file: unfurledMediaSchema,
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIFileComponent =>
      removeUndefined({
        type: ComponentType.File as const,
        id: obj.props.id,
        spoiler: obj.props.spoiler,
        file: obj.props.file,
      }),
  );
