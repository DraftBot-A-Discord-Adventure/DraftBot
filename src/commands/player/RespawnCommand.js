const Maps = require("../../core/Maps");

/**
 * Allow a player who is dead to respawn
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const RespawnCommand = async(language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity) !== true) {
		return;
	}

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

		const destinationMaps = await Maps.getNextPlayerAvailableMaps(entity.Player, null);

		await Maps.removeEffect(entity.Player);
		await Maps.stopTravel(entity.Player);
		await Maps.startTravel(entity.Player, destinationMaps[draftbotRandom.integer(0,destinationMaps.length - 1)], message.createdAt.getTime());

		await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);

		await message.channel.send(format(JsonReader.commands.respawn.getTranslation(language).respawn, {
			pseudo: message.author.username,
			lostScore: lostScore
		}));

		log(message.author.id + " respawned (" + lostScore + " points lost)");
	}
};

module.exports = {
	commands: [
		{
			name: "respawn",
			func: RespawnCommand
		}
	]
};
