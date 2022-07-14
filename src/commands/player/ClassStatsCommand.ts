import Class, {Classes} from "../../core/models/Class";
import {Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Data} from "../../core/Data";

function addActionsFields(embed: DraftBotEmbed, classToShow: Class, language: string) {
	for (const action of classToShow.getFightActions()) {
		const actionTr = Translations.getModule("fightactions." + action, language);
		embed.addField(Data.getModule("fightactions." + action).getString("emote") + " " + actionTr.get("name"), actionTr.get("description"));
	}
}

/**
 * Display information about classes
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const classTranslations = Translations.getModule("commands.classStats", language);
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());

	const listEmoji = Data.getModule("commands.classStats").getString("listEmoji");
	const emojis: string[] = [];
	const classesLineDisplay: string[] = [];
	for (const _class of allClasses) {
		emojis.push(_class.emoji);
		classesLineDisplay.push(_class.toString(language, entity.Player.level));
	}

	const baseEmbed = new DraftBotEmbed()
		.setTitle(classTranslations.get("listTitle"))
		.setDescription(classTranslations.get("listDesc"))
		.addField(
			"\u200b", classesLineDisplay.join("\n")
		);

	const reply = await interaction.reply({embeds: [baseEmbed], fetchReply: true}) as Message;

	const collector = reply.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => reaction.me && !reaction.users.cache.last().bot && user === interaction.user,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: Data.getModule("commands.profile").getNumber("badgeMaxReactNumber")
	});

	collector.on("collect", async (reaction) => {
		const reactionEmoji = reaction.emoji.name;

		let classToShow: Class = null;
		if (emojis.includes(reactionEmoji)) {
			classToShow = await Classes.getByEmoji(reactionEmoji);
			const newEmbed = new DraftBotEmbed()
				.setTitle(classTranslations.format("classTitle", {class: classToShow.getName(language)}))
				.setDescription(classToShow.getDescription(language) + "\n" + classToShow.statsToString(language, entity.Player.level));
			addActionsFields(newEmbed, classToShow, language);
			interaction.editReply({embeds: [newEmbed]});
		}

		if (reactionEmoji === listEmoji) {
			interaction.editReply({embeds: [baseEmbed]});
		}
	});

	reply.react(listEmoji);
	for (const emoji of emojis) {
		reply.react(emoji);
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("classstats")
		.setDescription("Display the stats you could have for each class"),
	executeCommand,
	requirements: {
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};