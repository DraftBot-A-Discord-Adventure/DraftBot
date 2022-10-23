import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {Constants} from "../../../../core/Constants";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {getIdFromMention} from "../../../../core/utils/StringUtils";
import {ITestCommand} from "../../../../core/CommandsTest";
import {EffectsConstants} from "../../../../core/constants/EffectsConstants";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "jailplayer",
	aliases: ["jail"],
	commandFormat: "<mention>",
	typeWaited: {
		mention: Constants.TEST_VAR_TYPES.MENTION
	},
	messageWhenExecuted: "Vous avez enfermé {player} !",
	description: "Enferme le joueur donné",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Jail the given player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const jailPlayerTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(getIdFromMention(args[0]));
	await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.LOCKED, 0, new Date(), NumberChangeReason.TEST);
	await player.save();
	return format(commandInfo.messageWhenExecuted, {player: args[0]});
};

commandInfo.execute = jailPlayerTestCommand;