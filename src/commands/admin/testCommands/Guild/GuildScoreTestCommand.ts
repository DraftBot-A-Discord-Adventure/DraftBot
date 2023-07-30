import Guild from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {draftBotInstance} from "../../../../core/bot";
import {NumberChangeReason} from "../../../../core/constants/LogsConstants";

export const commandInfo: ITestCommand = {
	name: "guildpoints",
	aliases: ["gpoints", "guildscore", "gscore"],
	commandFormat: "<points>",
	typeWaited: {
		points: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Votre guilde a maintenant {points} points !",
	description: "Mets le score de la guilde au nombre donné",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildScoreTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const guild = await Guild.findOne({where: {id: player.guildId}});
	if (guild === null) {
		throw new Error("Erreur gpoints : vous n'êtes pas dans une guilde !");
	}
	const guildScore = parseInt(args[0], 10);
	if (guildScore <= 0) {
		throw new Error("Erreur gpoints : score de guilde invalide ! Il doit être supérieur à 0 !");
	}
	guild.score = guildScore;
	draftBotInstance.logsDatabase.logGuildPointsChange(guild, NumberChangeReason.TEST).then();
	await guild.save();
	return format(commandInfo.messageWhenExecuted, {points: args[0]});
};

commandInfo.execute = guildScoreTestCommand;