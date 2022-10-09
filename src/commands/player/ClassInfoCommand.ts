import Class, {Classes} from "../../core/database/game/models/Class";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Data} from "../../core/Data";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {ProfileConstants} from "../../core/constants/ProfileConstants";
import {ClassInfoConstants} from "../../core/constants/ClassInfoConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";

/**
 * Add the field containing the available actions for the given class
 * @param embed
 * @param classToShow
 * @param language
 */
function addActionsFields(embed: DraftBotEmbed, classToShow: Class, language: string): void {
	for (const action of classToShow.getFightActions()) {
		const actionTr = Translations.getModule(`fightactions.${action}`, language);
		embed.addFields({
			name: `${Data.getModule(`fightactions.${action}`).getString("emote")} ${actionTr.get("name")}`,
			value: actionTr.get("description")
		});
	}
}

/**
 * Display information about classes
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	const classTranslations = Translations.getModule("commands.classInfo", language);
	const allClasses = await Classes.getByGroupId(player.getClassGroup());

	const emojis: string[] = [];
	const classesLineDisplay: string[] = [];
	for (const _class of allClasses) {
		emojis.push(_class.emoji);
		classesLineDisplay.push(_class.toString(language, player.level));
	}

	const baseEmbed = new DraftBotEmbed()
		.setTitle(classTranslations.get("listTitle"))
		.setDescription(classTranslations.get("listDesc"))
		.addFields({
			name: "\u200b",
			value: classesLineDisplay.join("\n")
		});

	const reply = await interaction.reply({embeds: [baseEmbed], fetchReply: true}) as Message;

	const collector = reply.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => reaction.me && !reaction.users.cache.last().bot && user === interaction.user,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: ProfileConstants.BADGE_MAXIMUM_REACTION
	});

	collector.on("collect", async (reaction) => {
		const reactionEmoji = reaction.emoji.name;

		let classToShow: Class = null;
		if (emojis.includes(reactionEmoji)) {
			classToShow = await Classes.getByEmoji(reactionEmoji);
			const newEmbed = new DraftBotEmbed()
				.setTitle(classTranslations.format("classTitle", {class: classToShow.getName(language)}))
				.setDescription(`${classToShow.getDescription(language)}\n${classToShow.statsToString(language, player.level)}\n${classTranslations.get("descriptionEnd")}`);
			addActionsFields(newEmbed, classToShow, language);
			await interaction.editReply({embeds: [newEmbed]});
		}

		if (reactionEmoji === ClassInfoConstants.LIST_EMOTE) {
			await interaction.editReply({embeds: [baseEmbed]});
		}
	});

	await reply.react(ClassInfoConstants.LIST_EMOTE);
	for (const emoji of emojis) {
		await reply.react(emoji);
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.classInfo", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.classInfo", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL,
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};