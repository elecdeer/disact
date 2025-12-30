import type { APIApplicationCommandInteraction } from "discord-api-types/v10";
import { getOriginalWebhookMessage, updateOriginalWebhookMessage } from "../api/discord-api";
import type { PayloadElements } from "../components/index.ts";
import { messageFlags } from "../utils/messageFlags";
import type { Session } from "./session";

/**
 * Application Command Interactionの型
 * discord-api-types/v10のAPIApplicationCommandInteractionを使用
 */
export type ApplicationCommandInteraction = APIApplicationCommandInteraction;

/**
 * Application Command InteractionからSessionを作成する際のオプション
 */
export type CreateSessionFromInteractionOptions = {
  /** レスポンスをephemeralにするか (デフォルト: false) */
  ephemeral?: boolean;
  /** getOriginalを毎回fetchするか、キャッシュを返すか (デフォルト: false) */
  alwaysFetch?: boolean;
};

/**
 * Application Command InteractionからSessionを作成する
 *
 * @param interaction - Discord APIから受け取ったApplication Command Interaction
 * @param options - Session作成オプション
 * @returns Session オブジェクト
 *
 * @example
 * ```typescript
 * const session = createSessionFromApplicationCommandInteraction(interaction, {
 *   ephemeral: false,
 *   alwaysFetch: false,
 * });
 *
 * await session.commit(payload);
 * const current = await session.getCurrent();
 * ```
 */
export const createSessionFromApplicationCommandInteraction = (
  interaction: ApplicationCommandInteraction,
  options?: CreateSessionFromInteractionOptions,
): Session => {
  const ephemeral = options?.ephemeral ?? false;
  const alwaysFetch = options?.alwaysFetch ?? false;

  let hasCommitted = false;
  let cachedPayload: PayloadElements | null = null;

  return {
    commit: async (payload: PayloadElements): Promise<void> => {
      if (!hasCommitted) {
        // 初回: POST /interactions/{interaction.id}/{interaction.token}/callback
        await updateOriginalWebhookMessage(interaction.application_id, interaction.token, {
          components: payload,
          flags: messageFlags({
            isComponentsV2: true,
            ephemeral,
          }),
        });
        hasCommitted = true;
      } else {
        // 2回目以降: PATCH /webhooks/{application.id}/{interaction.token}/messages/@original
        await updateOriginalWebhookMessage(interaction.application_id, interaction.token, {
          components: payload,
        });
      }
      cachedPayload = payload;
    },

    getCurrent: async (): Promise<PayloadElements | null> => {
      if (!hasCommitted) {
        return null;
      }

      if (!alwaysFetch) {
        return cachedPayload;
      }

      // alwaysFetchがtrueの場合、APIから取得
      const response = await getOriginalWebhookMessage(
        interaction.application_id,
        interaction.token,
      );

      if (response.components) {
        // MessageResponse.components を PayloadElement として返す
        const payload = response.components as unknown as PayloadElements;
        cachedPayload = payload;
        return payload;
      }

      return null;
    },
  };
};
