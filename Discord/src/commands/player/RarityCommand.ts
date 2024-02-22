import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandRarityPacketReq, CommandRarityPacketRes} from "../../../../Lib/src/packets/commands/CommandRarityPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {ICommand} from "../ICommand";

function getPacket(): CommandRarityPacketReq {
	return makePacket(CommandRarityPacketReq, {});
}

export async function handleCommandRarityPacketRes(packet: CommandRarityPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		await interaction.reply({
			embeds: [new DraftBotEmbed()
				.setTitle(i18n.t("commands:rarity.title", {
					lng: interaction.channel.language
				}
				))
				.setDescription(i18n.t("commands:rarity.rarities", {
					common: packet.common,
					uncommon: packet.uncommon,
					exotic: packet.exotic,
					rare: packet.rare,
					special: packet.special,
					epic: packet.epic,
					legendary: packet.legendary,
					unique: packet.unique,
					lng: interaction.channel.language
				}))]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("rarity"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};