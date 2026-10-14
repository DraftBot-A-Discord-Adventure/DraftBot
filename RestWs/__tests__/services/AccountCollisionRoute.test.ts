import { afterEach, describe, expect, it, vi } from "vitest";
import fastify, { FastifyInstance } from "fastify";
import { setupAccountCollisionRoutes } from "../../src/services/routes/AccountCollisionRoute";
import { AccountCollisionService } from "../../src/services/AccountCollisionService";
import { ACCOUNT_COLLISION_ENDPOINTS } from "../../../WsPackets/src/objects/AccountCollision";

vi.mock("../../src/index", () => ({keycloakConfig: {url: "https://keycloak.test", realm: "test", clientId: "test", clientSecret: "test-only"}}));

let server: FastifyInstance;
afterEach(async () => { await server?.close(); });

describe("account collision HTTP boundary", () => {
	it("forwards only authenticated session tokens, never client-supplied account IDs", async () => {
		const service = new AccountCollisionService({url: "https://keycloak.test", realm: "test", clientId: "test", clientSecret: "test-only"});
		const resolve = vi.spyOn(service, "resolve").mockResolvedValue({kept: "discord"});
		server = fastify();
		setupAccountCollisionRoutes(server, service);
		const response = await server.inject({method: "POST", url: ACCOUNT_COLLISION_ENDPOINTS.RESOLVE, headers: {authorization: "Bearer discord-token"}, payload: {otherToken: "email-token", keep: "discord"}});
		expect(response.statusCode).toBe(200);
		expect(resolve).toHaveBeenCalledWith("discord-token", "email-token", "discord");
	});

	it.each([
		{otherToken: "email-token", keep: "email", deletedId: "victim"},
		{otherToken: "email-token", keep: "invalid"},
		{keep: "discord"}
	])("rejects a malformed or account-targeting resolution body ($keep)", async payload => {
		const service = new AccountCollisionService({url: "https://keycloak.test", realm: "test", clientId: "test", clientSecret: "test-only"});
		const resolve = vi.spyOn(service, "resolve");
		server = fastify({ajv: {customOptions: {removeAdditional: false}}});
		setupAccountCollisionRoutes(server, service);
		const response = await server.inject({method: "POST", url: ACCOUNT_COLLISION_ENDPOINTS.RESOLVE, headers: {authorization: "Bearer kept-token"}, payload});
		expect(response.statusCode).toBe(400);
		expect(resolve).not.toHaveBeenCalled();
	});
});