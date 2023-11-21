import {Constants} from "../../../../core/Constants";
import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {format} from "../../../../core/utils/StringFormatter";
import {ITestCommand} from "../../../../core/CommandsTest";
import {EffectsConstants} from "../../../../core/constants/EffectsConstants";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Players} from "../../../../core/database/game/models/Player";
import {DraftbotInteraction} from "../../../../core/messages/DraftbotInteraction";
import {minutesDisplay} from "../../../../core/utils/TimeUtils";

export const commandInfo: ITestCommand = {
	name: "playerpause",
	aliases: ["pause"],
	commandFormat: "<duration>",
	typeWaited: {
		effect: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous vous mettez en pause pendant {duration} !",
	description: `Vous mets en pause pendant une durée en minutes donnée`,
	commandTestShouldReply: true,
	execute: null // Defined later
};

const playerPauseTestCommand = async (language: string, interaction: DraftbotInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const time = Number(args[0]);
	if (time > 0) {
		await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, time, new Date(), NumberChangeReason.TEST);
		await player.save();
		return format(commandInfo.messageWhenExecuted, {duration: minutesDisplay(time, language)});
	}
	throw new Error("Durée invalide ! La durée doit être supérieure à 0.");
};

commandInfo.execute = playerPauseTestCommand;