import {Maps} from "../../../../core/maps/Maps";
import {MapLinks} from "../../../../core/database/game/models/MapLink";
import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "initplayer",
	aliases: ["init"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez initialisé votre joueur !",
	description: "Initialise votre joueur pour des tests",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Initialize the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const initPlayerTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	player.level = 1;
	player.score = 2000;
	player.weeklyScore = 0;
	player.experience = 0;
	player.money = 0;
	player.badges = null;
	player.effectEndDate = new Date();
	player.effectDuration = 0;
	player.health = await player.getMaxHealth();
	await TravelTime.removeEffect(player, NumberChangeReason.TEST);
	await Maps.startTravel(player, await MapLinks.getRandomLink(), 0, NumberChangeReason.TEST);
	await player.save();

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = initPlayerTestCommand;