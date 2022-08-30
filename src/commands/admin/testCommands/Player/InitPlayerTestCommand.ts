import {Entities} from "../../../../core/database/game/models/Entity";
import {Maps} from "../../../../core/Maps";
import {MapLinks} from "../../../../core/database/game/models/MapLink";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Initialize the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const initPlayerTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.level = 1;
	entity.Player.score = 2000;
	entity.Player.weeklyScore = 0;
	entity.Player.experience = 0;
	entity.Player.money = 0;
	entity.Player.badges = null;
	entity.Player.effectEndDate = new Date();
	entity.Player.effectDuration = 0;
	await Maps.removeEffect(entity.Player, NumberChangeReason.TEST);
	await Maps.startTravel(entity.Player, await MapLinks.getRandomLink(), 0, NumberChangeReason.TEST);
	entity.Player.startTravelDate = new Date();
	await entity.Player.save();

	entity.maxHealth = 100;
	entity.health = 100;
	entity.attack = 50;
	entity.defense = 20;
	entity.speed = 10;
	await entity.save();

	return commandInfo.messageWhenExecuted;
};

export const commandInfo: ITestCommand = {
	name: "initplayer",
	aliases: ["init"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez initialisé votre joueur !",
	description: "Initialise votre joueur pour des tests",
	commandTestShouldReply: true,
	execute: initPlayerTestCommand
};