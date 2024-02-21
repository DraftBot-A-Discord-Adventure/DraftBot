import {ICommand} from "../ICommand";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {CommandReportPacketReq} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";

async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandReportPacketReq> {
	await interaction.deferReply();
	return Promise.resolve(makePacket(CommandReportPacketReq, {keycloakId: user.id}));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("report"),
	getPacket,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};