import { afterEach, describe, expect, it, vi } from "vitest";
import { MqttManager } from "../../src/mqtt/MqttManager";
import { coreAccountAdventures } from "../../src/services/CoreAccountAdventures";
import { PacketContext } from "../../../Lib/src/packets/CrowniclesPacket";
import { CommandAccountAdventuresReq, CommandAccountAdventuresRes } from "../../../Lib/src/packets/commands/CommandAccountAdventuresPacket";
import { ErrorMaintenancePacket } from "../../../Lib/src/packets/commands/ErrorPacket";

vi.mock("../../src/index", () => ({keycloakConfig: {}, restWsConfig: {PREFIX: "test"}}));

function sentRequest(): {context: PacketContext; packet: CommandAccountAdventuresReq} {
	const [context, packet] = vi.mocked(MqttManager.globalMqttClient.sendToBackEnd).mock.calls[0];
	return {context, packet: packet as CommandAccountAdventuresReq};
}

describe("account adventures asked to Core", () => {
	afterEach(() => vi.useRealTimers());

	function connect(): void {
		MqttManager.globalMqttClient = {sendToBackEnd: vi.fn()} as unknown as typeof MqttManager.globalMqttClient;
	}

	it("asks for both accounts on behalf of the requester and answers what Core read", async () => {
		connect();
		const adventures = coreAccountAdventures("requester", ["discord-user", "email-user"]);
		await vi.waitFor(() => expect(MqttManager.globalMqttClient.sendToBackEnd).toHaveBeenCalledOnce());
		const {context, packet} = sentRequest();
		expect(context.keycloakId).toBe("requester");
		expect(context.webSocket).toEqual({});
		expect(packet.keycloakIds).toEqual(["discord-user", "email-user"]);
		const read = [{keycloakId: "discord-user", level: 42, score: 1000, classId: 3}];
		await expect(MqttManager.asyncPacketSender.handleResponse(context, CommandAccountAdventuresRes.name, {adventures: read} as CommandAccountAdventuresRes)).resolves.toBe(true);
		await expect(adventures).resolves.toEqual(read);
	});

	it("answers nothing when Core refuses, for instance during a maintenance", async () => {
		connect();
		const adventures = coreAccountAdventures("requester", ["discord-user"]);
		await vi.waitFor(() => expect(MqttManager.globalMqttClient.sendToBackEnd).toHaveBeenCalledOnce());
		await MqttManager.asyncPacketSender.handleResponse(sentRequest().context, ErrorMaintenancePacket.name, {});
		await expect(adventures).resolves.toEqual([]);
	});

	it("does not keep the player waiting when Core stays silent", async () => {
		vi.useFakeTimers();
		connect();
		const adventures = coreAccountAdventures("requester", ["discord-user"]);
		await vi.advanceTimersByTimeAsync(5_000);
		await expect(adventures).resolves.toEqual([]);
	});
});
