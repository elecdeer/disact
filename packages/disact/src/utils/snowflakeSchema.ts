import * as z from "zod";

/**
 * Discord Snowflake ID schema
 * Snowflake IDs are represented as strings matching the pattern: 0 or a positive integer without leading zeros
 */
export const snowflakeSchema = z.string().regex(/^(0|[1-9][0-9]*)$/);
