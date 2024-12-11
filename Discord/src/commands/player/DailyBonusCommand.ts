import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {
	CommandDailyBonusPacketReq,
	CommandDailyBonusPacketRes
} from "../../../../Lib/src/packets/commands/CommandDailyBonusPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import i18n from "../../translations/i18n";
import {hoursToMilliseconds, minutesDisplay, printTimeBeforeDate} from "../../../../Lib/src/utils/TimeUtils";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ItemConstants, ItemNature} from "../../../../Lib/src/constants/ItemConstants";

/**
 * Get the daily bonus packet to send to the server
 * @param interaction
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandDailyBonusPacketReq> {
	await interaction.deferReply();
	return makePacket(CommandDailyBonusPacketReq, {});
}

/**
 * Handle daily bonus cooldown error
 * @param context
 * @param lastDailyTimestamp
 * @param cooldownTime
 */
export async function handleDailyBonusCooldownError(context: PacketContext, lastDailyTimestamp: number, cooldownTime: number): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	await interaction?.editReply({
		embeds: [
			new DraftBotErrorEmbed(
				interaction.user,
				interaction,
				i18n.t("commands:daily.errors.cooldown", {
					cooldownTime,
					time: printTimeBeforeDate(hoursToMilliseconds(cooldownTime) - lastDailyTimestamp),
					lng: interaction.userLanguage,
					interpolation: {escapeValue: false}
				})
			)
		]
	});
}

/**
 * Handle daily bonus success
 * @param context
 * @param packet
 */
export async function handleDailyBonusRes(context: PacketContext, packet: CommandDailyBonusPacketRes): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	await interaction?.editReply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:daily.title", {
					pseudo: interaction.user.displayName,
					lng: interaction.userLanguage
				}), interaction.user)
				.setDescription(
					i18n.t("commands:daily.description", {
						value: packet.itemNature === ItemNature.TIME_SPEEDUP ? minutesDisplay(packet.value) : packet.value,
						nature: ItemConstants.NATURE_ID_TO_NAME[packet.itemNature],
						lng: interaction.userLanguage
					})
				)
		]
	});
}


export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("daily"),
	getPacket,
	mainGuildCommand: false
};