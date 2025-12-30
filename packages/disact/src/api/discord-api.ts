/**
 * Discord API client using ofetch and discord-api-types
 */

import type {
  RESTGetAPIWebhookWithTokenMessageResult,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPatchAPIWebhookWithTokenMessageResult,
  RESTPostAPIInteractionCallbackJSONBody,
  RESTPostAPIInteractionCallbackResult,
} from "discord-api-types/v10";
import { ofetch } from "ofetch";
import { getDisactLogger } from "../utils/logger";

const API_BASE_URL = "https://discord.com/api/v10";

const logger = getDisactLogger("api");

/**
 * Create an interaction response
 * POST /interactions/{interaction.id}/{interaction.token}/callback
 */
export const createInteractionResponse = async (
  interactionId: string,
  interactionToken: string,
  body: RESTPostAPIInteractionCallbackJSONBody,
): Promise<RESTPostAPIInteractionCallbackResult> => {
  try {
    logger.debug("Sending interaction response", { interactionId, body });
    return await ofetch(
      `${API_BASE_URL}/interactions/${interactionId}/${interactionToken}/callback`,
      {
        method: "POST",
        body,
      },
    );
  } catch (error) {
    logger.error("Discord API request failed", {
      error,
      errorData: error && typeof error === "object" && "data" in error ? error.data : undefined,
      endpoint: "createInteractionResponse",
      interactionId,
    });
    throw error;
  }
};

/**
 * Get original webhook message
 * GET /webhooks/{application.id}/{interaction.token}/messages/@original
 */
export const getOriginalWebhookMessage = async (
  applicationId: string,
  interactionToken: string,
): Promise<RESTGetAPIWebhookWithTokenMessageResult> => {
  return await ofetch(
    `${API_BASE_URL}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: "GET",
    },
  );
};

/**
 * Update original webhook message
 * PATCH /webhooks/{application.id}/{interaction.token}/messages/@original
 */
export const updateOriginalWebhookMessage = async (
  applicationId: string,
  interactionToken: string,
  body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
): Promise<RESTPatchAPIWebhookWithTokenMessageResult> => {
  return await ofetch(
    `${API_BASE_URL}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: "PATCH",
      body,
    },
  );
};
