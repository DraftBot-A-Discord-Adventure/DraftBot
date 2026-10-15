import {
	beforeEach, describe, expect, it, vi
} from "vitest";
import { EventEmitter } from "node:events";
import { CrowniclesActionChooseCachedMessage } from "../../src/messages/CrowniclesActionChooseCachedMessage";
import { DiscordCollectorUtils } from "../../src/utils/DiscordCollectorUtils";
import { ReactionCollectorFightChooseActionPacket } from "../../../Lib/src/packets/interaction/ReactionCollectorFightChooseAction";
import { PacketContext } from "../../../Lib/src/packets/CrowniclesPacket";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";

vi.mock("../../src/bot/CrowniclesShard", () => ({
	crowniclesClient: { users: { fetch: vi.fn() } }
}));
vi.mock("../../src/bot/DiscordCache", () => ({
	DiscordCache: {
		getInteraction: vi.fn(() => ({
			userLanguage: "fr",
			user: {
				displayAvatarURL: (): string => "https://example.com/avatar.png",
				displayName: "Tester"
			}
		}))
	}
}));
vi.mock("../../src/utils/DisplayUtils", () => ({
	DisplayUtils: { getEscapedUsername: vi.fn(() => Promise.resolve("Tester")) }
}));
vi.mock("../../src/utils/ErrorUtils", () => ({
	sendInteractionNotForYou: vi.fn()
}));
vi.mock("../../src/utils/DiscordCollectorUtils", () => ({
	DiscordCollectorUtils: { sendReaction: vi.fn() },
	disableRows: vi.fn()
}));
vi.mock("../../../Lib/src/logs/CrowniclesLogger", () => ({
	CrowniclesLogger: { warn: vi.fn() }
}));

const PLAYER_DISCORD_ID = "player";

const context = {
	keycloakId: "keycloak",
	discord: {
		user: PLAYER_DISCORD_ID,
		channel: "channel",
		interaction: "interaction",
		language: "fr",
		shardId: 0
	}
} as PacketContext;

const packet = {
	id: "collector",
	endTime: Date.now() + 120_000,
	data: {
		data: {
			fightId: "fight",
			fighterKeycloakId: "keycloak"
		}
	},
	reactions: [
		{
			type: "action",
			data: { id: "simpleAttack" }
		},
		{
			type: "action",
			data: { id: "heavyAttack" }
		}
	]
} as unknown as ReactionCollectorFightChooseActionPacket;

/**
 * Display the action buttons and return the emitter standing for the Discord component collector
 */
async function displayActionButtons(): Promise<EventEmitter> {
	const collector = new EventEmitter();
	const message = new CrowniclesActionChooseCachedMessage("interaction");
	vi.spyOn(message, "post").mockResolvedValue({
		createMessageComponentCollector: () => collector
	} as never);
	await message.updateMessage(packet, context);
	return collector;
}

/**
 * Emit a click and wait for the asynchronous collect handler to settle
 */
async function click(collector: EventEmitter, update: () => Promise<void>): Promise<void> {
	collector.emit("collect", {
		user: { id: PLAYER_DISCORD_ID },
		customId: "heavyAttack",
		update
	});
	await vi.waitFor(() => expect(update).toHaveBeenCalled());
	await new Promise(resolve => setImmediate(resolve));
}

describe("CrowniclesActionChooseCachedMessage", () => {
	beforeEach(() => {
		vi.mocked(DiscordCollectorUtils.sendReaction).mockClear();
	});

	it("sends the chosen action once the click is acknowledged", async () => {
		const collector = await displayActionButtons();

		await click(collector, vi.fn().mockResolvedValue(undefined));

		expect(DiscordCollectorUtils.sendReaction).toHaveBeenCalledOnce();
		expect(vi.mocked(DiscordCollectorUtils.sendReaction).mock.calls[0][4]).toBe(1);
	});

	it("still sends the chosen action when Discord rejects the late acknowledgement", async () => {
		const collector = await displayActionButtons();

		await click(collector, vi.fn().mockRejectedValue(new Error("Unknown interaction")));

		expect(DiscordCollectorUtils.sendReaction).toHaveBeenCalledOnce();
		expect(vi.mocked(DiscordCollectorUtils.sendReaction).mock.calls[0][4]).toBe(1);
		expect(CrowniclesLogger.warn).toHaveBeenCalledOnce();
	});
});
