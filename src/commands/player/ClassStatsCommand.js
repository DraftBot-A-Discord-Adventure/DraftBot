import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

module.exports.help = {
	name: "classtats",
	aliases: ["cs","classesstats","classcompare","classestats"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Display information about classes
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ClassStatsCommand(message, language) {
	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	const classTranslations = JsonReader.commands.classStats.getTranslation(language);

	const classesLineDisplay = [];
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());
	for (let k = 0; k < allClasses.length; k++) {
		classesLineDisplay.push(allClasses[k].toString(language, entity.Player.level));
	}

	// Creating classstats message
	await message.channel.send(
		new DraftBotEmbed()
			.setTitle(classTranslations.title)
			.setDescription(classTranslations.desc)
			.addField(
				"\u200b", classesLineDisplay.join("\n")
			)
	);
}

module.exports.execute = ClassStatsCommand;