import {
	FastifyInstance, FastifyReply
} from "fastify";
import { CrowniclesLogger } from "../../../../Lib/src/logs/CrowniclesLogger";
import { requireAppProtocol } from "../AppProtocol";
import {
	DiscordActivityFailure, DiscordActivitySessions
} from "../DiscordActivitySessions";
import {
	DISCORD_ACTIVITY_ENDPOINTS, DISCORD_ACTIVITY_ERRORS, DiscordActivityRefreshRequest, DiscordActivitySession, DiscordActivitySessionRequest
} from "../../../../WsPackets/src/objects/DiscordActivity";

const HTTP_NOT_FOUND = 404;
const HTTP_SERVICE_UNAVAILABLE = 503;

/** Bounds a value the client sends, before it is forwarded to Discord or Keycloak. */
const MAX_CREDENTIAL_LENGTH = 8192;

function bodyWith(field: string): object {
	return {
		type: "object",
		required: [field],
		additionalProperties: false,
		properties: {
			[field]: {
				type: "string", minLength: 1, maxLength: MAX_CREDENTIAL_LENGTH
			}
		}
	};
}

async function respond(reply: FastifyReply, action: () => Promise<DiscordActivitySession>): Promise<void> {
	try {
		reply.header("Cache-Control", "no-store").send(await action());
	}
	catch (error) {
		if (error instanceof DiscordActivityFailure) {
			reply.status(error.status).send({ error: error.reason });
			return;
		}
		CrowniclesLogger.errorWithObj("Discord Activity session failed", error);
		reply.status(HTTP_SERVICE_UNAVAILABLE).send({ error: DISCORD_ACTIVITY_ERRORS.UNAVAILABLE });
	}
}

/** Signs in the players who open the game as a Discord Activity; absent when the server does not host it. */
export function setupDiscordActivityRoutes(server: FastifyInstance, sessions: DiscordActivitySessions): void {
	const options = { onRequest: requireAppProtocol };
	if (!sessions.enabled) {
		const disabled = (_request: unknown, reply: FastifyReply): void => {
			reply.status(HTTP_NOT_FOUND).send({ error: DISCORD_ACTIVITY_ERRORS.DISABLED });
		};
		server.post(DISCORD_ACTIVITY_ENDPOINTS.SESSION, options, disabled);
		server.post(DISCORD_ACTIVITY_ENDPOINTS.REFRESH, options, disabled);
		return;
	}
	server.post<{ Body: DiscordActivitySessionRequest }>(DISCORD_ACTIVITY_ENDPOINTS.SESSION, {
		...options, schema: { body: bodyWith("code") }
	}, async (request, reply): Promise<void> => {
		await respond(reply, () => sessions.open(request.body.code));
	});
	server.post<{ Body: DiscordActivityRefreshRequest }>(DISCORD_ACTIVITY_ENDPOINTS.REFRESH, {
		...options, schema: { body: bodyWith("refreshToken") }
	}, async (request, reply): Promise<void> => {
		await respond(reply, () => sessions.refresh(request.body.refreshToken));
	});
}
