import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {CommandDrinkPacketReq} from "../../../../Lib/src/packets/commands/CommandDrinkPacket";

/**
 * Get the daily bonus packet to send to the server
 * @param interaction
 */
async function getPacket(interaction: DraftbotInteraction): Promise<CommandDrinkPacketReq> {
	const forceOption = interaction.options.get("force");

	let force = false;
	if (forceOption) {
		force = <boolean>forceOption.value;
	}

	await interaction.deferReply();
	return makePacket(CommandDrinkPacketReq, { force });
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("drink"),
	getPacket,
	mainGuildCommand: false
};