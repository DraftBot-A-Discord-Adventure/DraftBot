import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandGuildDailyCooldownErrorPacket,
	CommandGuildDailyPacketReq, CommandGuildDailyPveIslandErrorPacket,
	CommandGuildDailyRewardPacket
} from "../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import i18n from "../../translations/i18n";
import {Language} from "../../../../Lib/src/Language";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {finishInTimeDisplay} from "../../../../Lib/src/utils/TimeUtils";

function getPacket(): CommandGuildDailyPacketReq {
	return makePacket(CommandGuildDailyPacketReq, {});
}

export function getCommandGuildDailyRewardPacketString(packet: CommandGuildDailyRewardPacket, lng: Language): string {
	let desc = "";
	if (packet.fullHeal) {
		desc += i18n.t("commands:guildDaily.rewards.fullHeal", { lng }) + "\n";
	}
	if (packet.advanceTime) {
		desc += i18n.t("commands:guildDaily.rewards.advanceTime", { lng, timeMoved: packet.advanceTime }) + "\n";
	}
	if (packet.personalXp) {
		desc += i18n.t("commands:guildDaily.rewards.personalXP", { lng, xp: packet.personalXp, interpolation: { escapeValue: false } }) + "\n";
	}
	if (packet.guildXp) {
		desc += i18n.t("commands:guildDaily.rewards.guildXP", { lng, xp: packet.guildXp, interpolation: { escapeValue: false } }) + "\n";
	}
	if (packet.superBadge) {
		desc += i18n.t("commands:guildDaily.rewards.superBadge", { lng }) + "\n";
	}
	if (packet.badge) {
		desc += i18n.t("commands:guildDaily.rewards.badge", { lng }) + "\n";
	}
	if (packet.money) {
		desc += i18n.t("commands:guildDaily.rewards.money", { lng, money: packet.money }) + "\n";
	}
	if (packet.heal) {
		desc += i18n.t("commands:guildDaily.rewards.partialHeal", { lng, healthWon: packet.heal }) + "\n";
	}
	if (packet.alteration) {
		if (packet.alteration.healAmount) {
			desc += i18n.t("commands:guildDaily.rewards.alterationHeal", {lng, healthWon: packet.alteration.healAmount, interpolation: { escapeValue: false }}) + "\n";
		}
		else {
			desc += i18n.t("commands:guildDaily.rewards.alterationNoHeal", {lng, interpolation: { escapeValue: false }}) + "\n";
		}
	}
	if (packet.commonFood) {
		desc += i18n.t("commands:guildDaily.rewards.petFood", { lng, quantity: packet.commonFood, interpolation: { escapeValue: false } }) + "\n";
	}
	if (packet.pet) {
		desc += i18n.t("commands:guildDaily.rewards.pet", {
			lng,
			emote: DisplayUtils.getPetIcon(packet.pet.typeId, packet.pet.sex),
			pet: DisplayUtils.getPetDisplay(packet.pet.typeId, packet.pet.sex, lng),
			interpolation: { escapeValue: false }
		}) + "\n";
	}

	return desc;
}

export async function handleCommandGuildDailyRewardPacket(packet: CommandGuildDailyRewardPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:guildDaily.rewardTitle", { lng: context.discord!.language, guildName: packet.guildName }), interaction.user)
				.setDescription(getCommandGuildDailyRewardPacketString(packet, context.discord!.language))
		]
	});
}

export async function handleCommandGuildDailyCooldownErrorPacket(packet: CommandGuildDailyCooldownErrorPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;
	await interaction.reply({
		embeds: [
			new DraftBotErrorEmbed(
				interaction.user,
				interaction,
				i18n.t(
					"commands:guildDaily.coolDown",
					{
						lng: context.discord!.language,
						coolDownTime: packet.totalTime,
						time: finishInTimeDisplay(new Date(Date.now() + packet.remainingTime)),
						interpolation: { escapeValue: false }
					}
				)
			)
		]
	});
}

export async function handleCommandGuildDailyPveIslandErrorPacket(packet: CommandGuildDailyPveIslandErrorPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;
	await interaction.reply({
		embeds: [
			new DraftBotErrorEmbed(
				interaction.user,
				interaction,
				i18n.t("commands:guildDaily.pveIslandError", { lng: context.discord!.language })
			)
		]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildDaily") as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};