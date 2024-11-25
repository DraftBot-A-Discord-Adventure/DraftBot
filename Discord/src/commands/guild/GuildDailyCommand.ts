import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandGuildDailyCooldownErrorPacket,
	CommandGuildDailyPacketReq,
	CommandGuildDailyPveIslandErrorPacket,
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
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";

function getPacket(): CommandGuildDailyPacketReq {
	return makePacket(CommandGuildDailyPacketReq, {});
}

function manageGivenReward(rewardKey: string, quantity: number | undefined, lng: Language): string {
	return quantity ? `${i18n.t(`commands:guildDaily.rewards.${rewardKey}`, {
		lng,
		quantity,
		interpolation: {escapeValue: false}
	})}\n` : "";
}

export function getCommandGuildDailyRewardPacketString(packet: CommandGuildDailyRewardPacket, lng: Language): string {
	let desc = "";
	const rewards: Record<string, number | undefined> = {
		fullHeal: packet.fullHeal as number | undefined,
		advanceTime: packet.advanceTime,
		personalXP: packet.personalXp,
		guildXP: packet.guildXp,
		superBadge: packet.superBadge as number | undefined,
		badge: packet.badge as number | undefined,
		money: packet.money,
		partialHeal: packet.heal,
		[packet.alteration?.healAmount ? "alterationHeal" : "alterationNoHeal"]: packet.alteration?.healAmount,
		petFood: packet.commonFood
	};

	for (const [key, value] of Object.entries(rewards)) {
		desc += manageGivenReward(key, value, lng);
	}

	if (packet.pet) {
		desc += `${i18n.t("commands:guildDaily.rewards.pet", {
			lng,
			context: packet.pet.isFemale ? PetConstants.SEX.FEMALE_FULL : PetConstants.SEX.MALE_FULL,
			pet: DisplayUtils.getPetDisplay(packet.pet.typeId, packet.pet.isFemale, lng),
			petId: packet.pet.typeId,
			interpolation: {escapeValue: false}
		})}\n`;
	}

	return desc;
}

export async function handleCommandGuildDailyRewardPacket(packet: CommandGuildDailyRewardPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:guildDaily.rewardTitle", {
					lng: context.discord!.language,
					guildName: packet.guildName
				}), interaction.user)
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
						interpolation: {escapeValue: false}
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
				i18n.t("commands:guildDaily.pveIslandError", {lng: context.discord!.language})
			)
		]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guildDaily") as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};