import {Entities} from "../../../../core/models/Entity";
import {Maps} from "../../../../core/Maps";
import {MapLinks} from "../../../../core/models/MapLink";

module.exports.commandInfo = {
	name: "initplayer",
	aliases: ["init"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez initialisé votre joueur !",
	description: "Initialise votre joueur pour des tests"
};

/**
 * Initialize the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const initPlayerTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.level = 1;
	entity.Player.score = 2000;
	entity.Player.weeklyScore = 0;
	entity.Player.experience = 0;
	entity.Player.money = 0;
	entity.Player.badges = null;
	entity.Player.effectEndDate = Date.now();
	entity.Player.effectDuration = 0;
	await Maps.removeEffect(entity.Player);
	await Maps.startTravel(entity.Player, await MapLinks.getRandomLink(), 0);
	entity.Player.startTravelDate = new Date();
	entity.Player.save();

	entity.maxHealth = 100;
	entity.health = 100;
	entity.attack = 50;
	entity.defense = 20;
	entity.speed = 10;
	await entity.save();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = initPlayerTestCommand;