const Maps = require("../../core/Maps");

module.exports.commandInfo = {
	name: "respawn",
	aliases: [],
	disallowEffects: [EFFECT.BABY]
};

/**
 * Allow a player who is dead to respawn
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const RespawnCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if (entity.Player.effect !== EFFECT.DEAD) {
		await sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.respawn.getTranslation(language).alive, {pseudo: message.author.username}));
	}
	else {
		const lostScore = Math.round(entity.Player.score * JsonReader.commands.respawn.score_remove_during_respawn);
		entity.health = await entity.getMaxHealth();
		entity.Player.addScore(-lostScore);
		entity.Player.addWeeklyScore(-lostScore);

		await Promise.all([
			entity.save(),
			entity.Player.save()
		]);

		await Maps.removeEffect(entity.Player);
		await Maps.stopTravel(entity.Player);
		const newlink = await MapLinks.getLinkByLocations(
			await entity.Player.getPreviousMapId(),
			await entity.Player.getDestinationId()
		);
		await Maps.startTravel(entity.Player, newlink, message.createdAt.getTime());

		await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);

		await message.channel.send(format(JsonReader.commands.respawn.getTranslation(language).respawn, {
			pseudo: message.author.username,
			lostScore: lostScore
		}));

		log(message.author.id + " respawned (" + lostScore + " points lost)");
	}
};

module.exports.execute = RespawnCommand;
