/**
 * Display information about classes
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ClassStatsCommand(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	const classTranslations = JsonReader.commands.classStats.getTranslation(language);

	const classesLineDisplay = [];
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());
	for (let k = 0; k < allClasses.length; k++) {
		classesLineDisplay.push(allClasses[k].toString(language, entity.Player.level));
	}

	// Creating classstats message
	await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setTitle(classTranslations.title)
			.setDescription(classTranslations.desc)
			.addField(
				"\u200b", classesLineDisplay.join("\n")
			)
	);
}

module.exports = {
	commands: [
		{
			name: "classstats",
			func: ClassStatsCommand,
			aliases: ["cs", "classesstats", "classcompare", "classestats"]
		}
	]
};