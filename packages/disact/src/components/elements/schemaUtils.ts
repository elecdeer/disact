import type { ComponentType } from "discord-api-types/v10";
import * as z from "zod";

export const messageComponentElementSchema = z.object({
  type: z.literal("intrinsic"),
  name: z.literal("message-component"),
});

/**
 * message-component要素のベーススキーマを作成
 *
 * @param componentType - ComponentType enum値
 * @param propsSchema - コンポーネント固有のpropsスキーマ
 * @param childrenSchema - children要素のスキーマ
 * @returns message-componentのZodスキーマ
 */
export const createMessageComponentSchemaBase = <
  TComponentType extends ComponentType,
  TPropsSchema extends z.ZodObject<z.ZodRawShape>,
  TChildrenSchema extends z.ZodTypeAny,
>(
  componentType: TComponentType,
  propsSchema: TPropsSchema,
  childrenSchema: TChildrenSchema,
) => {
  return z.object({
    type: z.literal("intrinsic"),
    name: z.literal("message-component"),
    props: propsSchema.extend({
      type: z.literal(componentType),
    }),
    children: childrenSchema,
  });
};

/**
 * propsのみのコンポーネント用スキーマを作成（slot不使用）
 *
 * @param componentType - ComponentType enum値
 * @param propsSchema - コンポーネント固有のpropsスキーマ
 * @param transformFn - Discord API形式への変換関数
 * @returns transformを含むZodスキーマ
 *
 * @example
 * ```ts
 * export const separatorElementSchema = createPropsOnlyComponentSchema(
 *   ComponentType.Separator,
 *   z.object({
 *     id: z.optional(z.number().int().min(0)),
 *     spacing: z.optional(z.number().nullable()),
 *     divider: z.optional(z.boolean()),
 *   }),
 *   (props) => removeUndefined({
 *     type: ComponentType.Separator as const,
 *     id: props.id,
 *     spacing: props.spacing,
 *     divider: props.divider,
 *   }),
 * );
 * ```
 */
export const createPropsOnlyComponentSchema = <
  TComponentType extends ComponentType,
  TPropsSchema extends z.ZodObject<z.ZodRawShape>,
  TOutput,
>(
  componentType: TComponentType,
  propsSchema: TPropsSchema,
  transformFn: (props: z.output<TPropsSchema> & { type: TComponentType }) => TOutput,
) => {
  return createMessageComponentSchemaBase(componentType, propsSchema, z.null()).transform((obj) =>
    transformFn(obj.props as z.output<TPropsSchema> & { type: TComponentType }),
  );
};

/**
 * 名前付きslot要素のスキーマを作成
 *
 * @param slotName - slotの名前
 * @param contentSchema - slot内のコンテンツスキーマ
 * @param options - min/maxの制約オプション
 * @returns slotのZodスキーマ
 *
 * @example
 * ```ts
 * const componentsSlot = createNamedSlotSchema(
 *   "components",
 *   z.union([buttonElementSchema, textDisplayElementSchema]),
 *   { min: 1, max: 3 },
 * );
 * ```
 */
export const createNamedSlotSchema = <
  TSlotName extends string,
  TContentSchema extends z.ZodTypeAny,
>(
  slotName: TSlotName,
  contentSchema: TContentSchema,
  options?: { min?: number; max?: number },
) => {
  let childrenSchema = z.array(contentSchema);

  if (options?.min !== undefined) {
    childrenSchema = childrenSchema.min(options.min);
  }
  if (options?.max !== undefined) {
    childrenSchema = childrenSchema.max(options.max);
  }

  return z.object({
    type: z.literal("intrinsic"),
    name: z.literal("slot"),
    props: z.object({ name: z.literal(slotName) }),
    children: childrenSchema,
  });
};

/**
 * 単一slotのコンポーネント用スキーマを作成
 *
 * @param componentType - ComponentType enum値
 * @param propsSchema - コンポーネント固有のpropsスキーマ
 * @param slotName - slotの名前
 * @param slotContentSchema - slot内のコンテンツスキーマ
 * @param transformFn - Discord API形式への変換関数
 * @param options - オプション（optionalでslotを任意にできる）
 * @returns transformを含むZodスキーマ
 *
 * @example
 * ```ts
 * export const textDisplayElementSchema = createSingleSlotComponentSchema(
 *   ComponentType.TextDisplay,
 *   z.object({ id: z.optional(z.number().int().min(0)) }),
 *   "children",
 *   z.object({ type: z.literal("text"), content: z.string() }),
 *   ({ props, slotContent }) => ({
 *     type: ComponentType.TextDisplay,
 *     id: props.id,
 *     text: extractTextContent(slotContent),
 *   }),
 * );
 * ```
 */
export const createSingleSlotComponentSchema = <
  TComponentType extends ComponentType,
  TPropsSchema extends z.ZodObject<z.ZodRawShape>,
  TSlotContentSchema extends z.ZodTypeAny,
  TOutput,
>(
  componentType: TComponentType,
  propsSchema: TPropsSchema,
  slotName: string,
  slotContentSchema: TSlotContentSchema,
  transformFn: (data: {
    props: z.output<TPropsSchema> & { type: TComponentType };
    slotContent: z.output<TSlotContentSchema>[];
  }) => TOutput,
  options?: { optional?: boolean },
) => {
  const slotSchema = createNamedSlotSchema(slotName, slotContentSchema);
  const childrenSchema = options?.optional
    ? z.optional(z.array(slotSchema).length(1))
    : z.array(slotSchema).length(1);

  return createMessageComponentSchemaBase(componentType, propsSchema, childrenSchema).transform(
    (obj) => {
      const slotContent =
        options?.optional && obj.children === undefined ? [] : obj.children?.[0]?.children ?? [];
      return transformFn({
        props: obj.props as z.output<TPropsSchema> & { type: TComponentType },
        slotContent,
      });
    },
  );
};

/**
 * children配列から特定名のslotの内容を抽出
 *
 * @param children - slot要素の配列
 * @param slotName - 抽出するslotの名前
 * @returns slotの内容配列、見つからない場合はundefined
 *
 * @example
 * ```ts
 * const accessoryContent = extractSlotContent(obj.children, "accessory");
 * ```
 */
export const extractSlotContent = <T>(
  children: Array<{ name: string; props: { name: string }; children: T[] }>,
  slotName: string,
): T[] | undefined => {
  return children.find((child) => child.name === "slot" && child.props.name === slotName)?.children;
};

/**
 * text型要素の配列を文字列に結合
 *
 * @param textNodes - text型要素の配列
 * @returns 結合された文字列
 *
 * @example
 * ```ts
 * const label = extractTextContent([
 *   { type: "text", content: "Hello " },
 *   { type: "text", content: "World" },
 * ]); // "Hello World"
 * ```
 */
export const extractTextContent = (textNodes: Array<{ type: "text"; content: string }>): string => {
  return textNodes.map((node) => node.content).join("");
};

/**
 * slot内のtext要素を抽出して文字列に結合
 *
 * ButtonやTextDisplayコンポーネントで使用
 *
 * @param children - slot要素の配列
 * @param slotName - 抽出するslotの名前
 * @returns 結合された文字列、見つからない場合はundefined
 *
 * @example
 * ```ts
 * const label = extractSingleSlotTextContent(obj.children, "children");
 * ```
 */
export const extractSingleSlotTextContent = (
  children:
    | Array<{
        name: string;
        props: { name: string };
        children: Array<{ type: string; content: string }>;
      }>
    | undefined,
  slotName: string,
): string | undefined => {
  if (!children) return undefined;
  const slotContent = extractSlotContent(children, slotName);
  if (!slotContent) return undefined;
  return extractTextContent(
    slotContent.filter((node): node is { type: "text"; content: string } => node.type === "text"),
  );
};

/**
 * 必須slotの内容を取得（存在しない場合はエラー）
 *
 * @param children - slot要素の配列
 * @param slotName - 取得するslotの名前
 * @returns slotの内容配列
 * @throws slotが見つからない場合にエラー
 *
 * @example
 * ```ts
 * const components = requireSlotContent(obj.children, "components");
 * ```
 */
export const requireSlotContent = <T>(
  children: Array<{ name: string; props: { name: string }; children: T[] }>,
  slotName: string,
): T[] => {
  const content = extractSlotContent(children, slotName);
  if (!content) {
    throw new Error(`Required slot "${slotName}" not found`);
  }
  return content;
};
