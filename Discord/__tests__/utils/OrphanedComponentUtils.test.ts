import {
	describe, expect, it, vi
} from "vitest";
import {
	ActionRow,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	MessageActionRowComponentBuilder
} from "discord.js";
import {
	isOrphanedComponentInteraction, replyToOrphanedComponentInteraction
} from "../../src/utils/OrphanedComponentUtils";
import { DiscordConstants } from "../../src/DiscordConstants";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";

vi.mock("../../../Lib/src/logs/CrowniclesLogger", () => ({
	CrowniclesLogger: {
		errorWithObj: vi.fn()
	}
}));

type ButtonJson = {
	disabled?: boolean;
};

function buildRow(): ActionRow<never> {
	const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
		new ButtonBuilder().setCustomId("0")
			.setLabel("1")
			.setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId("1")
			.setLabel("2")
			.setStyle(ButtonStyle.Secondary)
	);
	return new ActionRow(row.toJSON() as never);
}

function buildInteraction(options: {
	createdTimestamp: number;
	components: unknown[];
}): {
	interaction: never;
	update: ReturnType<typeof vi.fn>;
	followUp: ReturnType<typeof vi.fn>;
	reply: ReturnType<typeof vi.fn>;
} {
	const update = vi.fn().mockResolvedValue(undefined);
	const followUp = vi.fn().mockResolvedValue(undefined);
	const reply = vi.fn().mockResolvedValue(undefined);
	return {
		interaction: {
			locale: "fr",
			user: {
				displayName: "FoxB612",
				displayAvatarURL: (): string => "https://example.com/avatar.png"
			},
			message: {
				createdTimestamp: options.createdTimestamp,
				components: options.components
			},
			update,
			followUp,
			reply
		} as never,
		update,
		followUp,
		reply
	};
}

describe("isOrphanedComponentInteraction", () => {
	it("flags the components of a message sent before the shard process started", () => {
		const { interaction } = buildInteraction({
			createdTimestamp: performance.timeOrigin - DiscordConstants.ORPHANED_COMPONENT_CLOCK_MARGIN_MS - 60_000,
			components: []
		});

		expect(isOrphanedComponentInteraction(interaction)).toBe(true);
	});

	it("keeps the components of a message sent by the running process", () => {
		const { interaction } = buildInteraction({
			createdTimestamp: Date.now(),
			components: []
		});

		expect(isOrphanedComponentInteraction(interaction)).toBe(false);
	});

	it("tolerates a small clock gap around the start of the process", () => {
		const { interaction } = buildInteraction({
			createdTimestamp: performance.timeOrigin - DiscordConstants.ORPHANED_COMPONENT_CLOCK_MARGIN_MS / 2,
			components: []
		});

		expect(isOrphanedComponentInteraction(interaction)).toBe(false);
	});
});

describe("replyToOrphanedComponentInteraction", () => {
	it("disables the stale buttons and tells the player privately that the menu expired", async () => {
		const {
			interaction, update, followUp, reply
		} = buildInteraction({
			createdTimestamp: 0,
			components: [buildRow()]
		});

		await replyToOrphanedComponentInteraction(interaction);

		expect(update).toHaveBeenCalledOnce();
		const rows = (update.mock.calls[0][0] as { components: ActionRowBuilder[] }).components.map(row => row.toJSON());
		expect(rows).toHaveLength(1);
		expect(rows[0].type).toBe(ComponentType.ActionRow);
		expect((rows[0].components as ButtonJson[]).every(button => button.disabled === true)).toBe(true);

		expect(followUp).toHaveBeenCalledOnce();
		const followUpOptions = followUp.mock.calls[0][0] as {
			flags: number; embeds: { data: { description?: string } }[];
		};
		expect(followUpOptions.flags).toBeTruthy();
		expect(followUpOptions.embeds[0].data.description).toContain("plus actif");
		expect(reply).not.toHaveBeenCalled();
	});

	it("only replies when the message layout cannot be rebuilt", async () => {
		const {
			interaction, update, followUp, reply
		} = buildInteraction({
			createdTimestamp: 0,
			components: [{ type: ComponentType.Container }]
		});

		await replyToOrphanedComponentInteraction(interaction);

		expect(update).not.toHaveBeenCalled();
		expect(followUp).not.toHaveBeenCalled();
		expect(reply).toHaveBeenCalledOnce();
	});

	it("does not throw when Discord refuses the answer", async () => {
		const {
			interaction, reply
		} = buildInteraction({
			createdTimestamp: 0,
			components: [{ type: ComponentType.Container }]
		});
		reply.mockRejectedValue(new Error("Unknown interaction"));

		await expect(replyToOrphanedComponentInteraction(interaction)).resolves.toBeUndefined();
		expect(CrowniclesLogger.errorWithObj).toHaveBeenCalledOnce();
	});
});
