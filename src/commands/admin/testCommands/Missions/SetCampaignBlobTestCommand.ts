import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";
import {Campaign} from "../../../../core/missions/Campaign";
import {Constants} from "../../../../core/Constants";
import {format} from "../../../../core/utils/StringFormatter";
import {DraftbotInteraction} from "../../../../core/messages/DraftbotInteraction";

export const commandInfo: ITestCommand = {
	name: "setCampaignBlob",
	aliases: ["scb"],
	commandFormat: "<blob>",
	typeWaited: {
		blob: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez changé votre blob à {blob}",
	description: "Change le blob de la campagne à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // Defined later
};

const setCampaignBlobTestCommand = async (language: string, interaction: DraftbotInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	const givenBlob = args[0];
	const isGoodBlob = new RegExp(/^[01]+$/).test(givenBlob);
	if (givenBlob.length !== Campaign.getMaxCampaignNumber() || !isGoodBlob) {
		throw Error(`Blob invalide. Il doit être composé uniquement de 0 et de 1 et faire ${
			Campaign.getMaxCampaignNumber()
		} caractères (actuellement ${
			givenBlob.length
		} caractères, uniquement 0/1 : ${
			isGoodBlob
		}))`);
	}
	missionsInfo.campaignBlob = givenBlob;
	await missionsInfo.save();

	return format(commandInfo.messageWhenExecuted, {blob: givenBlob});
};

commandInfo.execute = setCampaignBlobTestCommand;