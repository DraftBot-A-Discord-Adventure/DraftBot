import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandMissionShopPacketReq} from "../../../../Lib/src/packets/commands/CommandMissionShopPacket";

/**
 * Get the packet to send to the server
 */
function getPacket(): CommandMissionShopPacketReq {
	return makePacket(CommandMissionShopPacketReq, {});
}

export async function skipMissionShopItemCollector(): Promise<void> {
	// TODO
}


export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("missionsshop"),
	getPacket,
	mainGuildCommand: false
};