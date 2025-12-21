import * as z from "zod";

/**
 * Slot要素のスキーマヘルパー
 *
 * slotはマーカーとして機能し、Zodスキーマでその中身を取り出す
 *
 * @param innerSchema - slot内の要素のスキーマ
 * @returns slotで包まれた要素を展開するスキーマ
 */
export const createSlotSchema = <T extends z.ZodTypeAny>(innerSchema: T) => {
  return z
    .object({
      type: z.literal("intrinsic"),
      name: z.literal("slot"),
      children: z
        .array(innerSchema)
        .length(1)
        .transform((arr) => arr[0]),
    })
    .transform((obj) => obj.children);
};
