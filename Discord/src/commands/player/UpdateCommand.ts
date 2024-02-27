import {CommandUpdatePacketReq, CommandUpdatePacketRes} from "../../../../Lib/src/packets/commands/CommandUpdatePacket";
import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DiscordCache} from "../../bot/DiscordCache";

/**
 * Shows the current version of the bot
 */
function getPacket(): CommandUpdatePacketReq {
	return makePacket(CommandUpdatePacketReq, {});
}

export async function handleCommandUpdatePacketRes(packet: CommandUpdatePacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		await interaction.reply({
			embeds: [new DraftBotEmbed()
				.setTitle(i18n.t("commands:update.title", {
					lng: interaction.channel.language
				}))
				.setDescription(i18n.t("commands:update.description", {
					coreVersion: packet.coreVersion,
					discordModuleVersion: process.env.npm_package_version,
					lng: interaction.channel.language
				}))]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("update"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};
