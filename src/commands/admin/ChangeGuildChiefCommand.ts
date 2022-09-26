import {Entities, Entity} from "../../core/database/game/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {draftBotClient, draftBotInstance} from "../../core/bot";
import {format} from "../../core/utils/StringFormatter";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 *Apply the changes due to validation
 * @param userToPromote
 * @param guild
 * @param interaction
 * @param tr
 */
function getEndCallbackChangeChief(
	userToPromote: Entity,
	guild: Guild,
	interaction: CommandInteraction,
	tr: TranslationModule): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		if (msg.isValidated()) {
			const formerChief = await Entities.getById(guild.chiefId);

			for (const member of await Entities.getByGuild(guild.id)) {
				sendDirectMessage(
					await draftBotClient.users.fetch(member.discordUserId.toString()),
					tr.get("DM.title"),
					format(tr.get("DM.description"), {
						old: await formerChief.Player.getPseudo(tr.language),
						oldID: formerChief.discordUserId,
						new: await userToPromote.Player.getPseudo(tr.language),
						newID: userToPromote.discordUserId,
						guild: guild.name
					}),
					null,
					tr.language
				);
			}
			draftBotInstance.logsDatabase.logGuildKick(guild, formerChief.discordUserId).then();
			formerChief.Player.guildId = null;

			if (guild.elderId === userToPromote.id) {
				draftBotInstance.logsDatabase.logGuildElderRemove(guild, guild.elderId).then();
				guild.elderId = null;
			}
			draftBotInstance.logsDatabase.logGuildChiefChange(guild, userToPromote.id).then();
			guild.chiefId = userToPromote.id;

			await Promise.all([
				guild.save(),
				userToPromote.save(),
				userToPromote.Player.save(),
				formerChief.save(),
				formerChief.Player.save()
			]);

			await interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.formatAuthor(tr.get("reply.title"), interaction.user)
						.setDescription(format(tr.get("reply.description"), {
							old: await formerChief.Player.getPseudo(tr.language),
							oldID: formerChief.discordUserId,
							new: await userToPromote.Player.getPseudo(tr.language),
							newID: userToPromote.discordUserId,
							guild: guild.name
						}))
				]
			});
			return;
		}

		await sendErrorMessage(interaction.user, interaction, tr.language, tr.get("validation.canceled"), true);
	};
}

/**
 * Checks if the member can become chief
 * @param userToPromote
 * @param userGuild
 * @param guild
 * @param interaction
 * @param tr
 * @returns boolean
 */
function checkMemberEligibility(userToPromote: Entity, userGuild: Guild | null, guild: Guild | null, interaction: CommandInteraction, tr: TranslationModule): boolean {

	if (guild === null) {
		replyErrorMessage(
			interaction,
			tr.language,
			tr.get("errors.unknownGuild")
		);
		return false;
	}

	if (!userGuild || userGuild.id !== guild.id) {
		replyErrorMessage(
			interaction,
			tr.language,
			tr.get("errors.notInTheGuild")
		);
		return false;
	}

	if (guild.chiefId === userToPromote.id) {
		replyErrorMessage(
			interaction,
			tr.language,
			tr.get("errors.alreadyChief")
		);
		return false;
	}
	return true;
}

/**
 * Force changing a guild chief
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.changeGuildChief", language);

	let userToPromote;
	try {
		userToPromote = await Entities.getByDiscordUserId(interaction.options.get("id").value as string);
	}
	catch {
		userToPromote = null;
	}
	if (!userToPromote) {
		await replyErrorMessage(
			interaction,
			language,
			tr.get("errors.wrongId")
		);
		return;
	}

	const guild = await Guilds.getByName(interaction.options.get("guild").value as string);
	const userGuild = await Guilds.getById(userToPromote.Player.guildId);

	if (!checkMemberEligibility(userToPromote, userGuild, guild, interaction, tr)) {
		return;
	}

	const endCallback = getEndCallbackChangeChief(userToPromote, guild, interaction, tr);

	await new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(tr.get("validation.title"), interaction.user)
		.setDescription(tr.format("validation.description", {
			userID: userToPromote.discordUserId,
			user: await draftBotClient.users.fetch(userToPromote.discordUserId.toString()),
			guild: guild.name
		}))
		.reply(interaction);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.changeGuildChief", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.changeGuildChief", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations,currentCommandEnglishTranslations)
		.addStringOption(option => option.setName("guild")
			.setDescription("The guild whose leader you want to change")
			.setRequired(true))
		.addStringOption(option => option.setName("id")
			.setDescription("The discord id of the user you want to promote")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};