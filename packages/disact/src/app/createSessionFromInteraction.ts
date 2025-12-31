import type { APIApplicationCommandInteraction } from "discord-api-types/v10";
import {
  createInteractionResponse,
  getOriginalWebhookMessage,
  updateOriginalWebhookMessage,
} from "../api/discord-api";
import type { PayloadElements } from "../components/index.ts";
import { getDisactLogger } from "../utils/logger";
import { messageFlags } from "../utils/messageFlags";
import type { Session } from "./session";

const logger = getDisactLogger("session");

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
  /** 既にDeferredレスポンスが返されているか (デフォルト: false) */
  deferred?: boolean;
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
): Session<ApplicationCommandInteraction> => {
  const ephemeral = options?.ephemeral ?? false;
  const alwaysFetch = options?.alwaysFetch ?? false;
  const deferred = options?.deferred ?? false;

  logger.debug("Creating session from interaction", {
    interactionId: interaction.id,
    commandName: interaction.data.name,
    ephemeral,
    alwaysFetch,
    deferred,
  });

  // deferredがtrueの場合は、既にDeferredレスポンスが返されているため
  // 最初から updateOriginalWebhookMessage を使用する
  let hasCommitted = deferred;
  let cachedPayload: PayloadElements | null = null;

  return {
    commit: async (payload: PayloadElements): Promise<void> => {
      if (!hasCommitted) {
        // 初回: POST /interactions/{interaction.id}/{interaction.token}/callback
        logger.info("Committing initial interaction response", {
          interactionId: interaction.id,
        });
        await createInteractionResponse(interaction.id, interaction.token, {
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: {
            components: payload,
            flags: messageFlags({
              isComponentsV2: true,
              ephemeral,
            }),
          },
        });
        hasCommitted = true;
      } else {
        // 2回目以降: PATCH /webhooks/{application.id}/{interaction.token}/messages/@original
        logger.debug("Updating interaction response", {
          interactionId: interaction.id,
        });
        await updateOriginalWebhookMessage(interaction.application_id, interaction.token, {
          components: payload,
          flags: messageFlags({
            isComponentsV2: true,
            ephemeral,
          }),
        });
      }
      cachedPayload = payload;
      logger.trace("Session state updated", { hasCommitted });
    },

    getCurrent: async (): Promise<PayloadElements | null> => {
      if (!hasCommitted) {
        logger.trace("getCurrent called before first commit");
        return null;
      }

      if (!alwaysFetch) {
        logger.trace("Returning cached payload");
        return cachedPayload;
      }

      // alwaysFetchがtrueの場合、APIから取得
      logger.debug("Fetching current state from API", {
        interactionId: interaction.id,
      });
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

    getInteraction: (): ApplicationCommandInteraction => {
      return interaction;
    },
  };
};
