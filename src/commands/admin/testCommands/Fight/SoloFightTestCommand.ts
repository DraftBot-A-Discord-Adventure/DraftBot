import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {FightController} from "../../../../core/fights/FightController";
import {Fighter} from "../../../../core/fights/Fighter";
import {Classes} from "../../../../core/database/game/models/Class";
import {Constants} from "../../../../core/Constants";

export const commandInfo: ITestCommand = {
	name: "solofight",
	commandFormat: "<instant>",
	typeWaited: {
		instant: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "",
	description: "Faire un combat contre soi-même",
	commandTestShouldReply: false,
	execute: null // defined later
};

/**
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param args
 * @return {String} - The successful message formatted
 */
const soloFightTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const playerClass = await Classes.getById(player.class);
	const fighter1 = new Fighter(interaction.user, player, playerClass);
	await fighter1.loadStats(false);
	const fighter2 = new Fighter(interaction.user, player, playerClass);
	await fighter2.loadStats(false);

	if (args[0] === "1") {
		fighter1.stats.attack = 9999;
		fighter2.stats.attack = 9999;
	}

	new FightController(fighter1, fighter2, false, interaction.channel, language)
		.startFight()
		.then();

	return null;
};

commandInfo.execute = soloFightTestCommand;