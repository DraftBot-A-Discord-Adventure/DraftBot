import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandGuildDailyPacketReq} from "../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";

function getPacket(): CommandGuildDailyPacketReq {
	return makePacket(CommandGuildDailyPacketReq, {});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("guilddaily") as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};