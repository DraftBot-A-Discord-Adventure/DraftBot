import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandPingPacketReq} from "../../../../Lib/src/packets/commands/CommandPingPacket";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Pings the bot, to check if it is alive and how well is it
 */
function getPacket(): CommandPingPacketReq {
	return makePacket<CommandPingPacketReq>(CommandPingPacketReq, { time: Date.now() });
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping!"), // todo i18n + slash command generator
	getPacket,
	requirements: {},
	mainGuildCommand: false
};