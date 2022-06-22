import {Entities, Entity} from "../../core/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/models/Guild";
import {draftBotClient} from "../../core/bot";
import {format} from "../../core/utils/StringFormatter";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";

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
	return async (msg: DraftBotValidateReactionMessage) => {
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

			formerChief.Player.guildId = null;

			if (guild.elderId === userToPromote.id) {
				guild.elderId = null;
			}
			guild.chiefId = userToPromote.id;

			await Promise.all([
				guild.save(),
				userToPromote.save(),
				userToPromote.Player.save(),
				formerChief.save(),
				formerChief.Player.save()
			]);

			interaction.followUp({
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

		sendErrorMessage(interaction.user, interaction.channel, tr.language, tr.get("validation.canceled"), true);
	};
}

/**
 * Allow the bot owner to give money to 1 or more people
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const tr = Translations.getModule("commands.changeGuildChief", language);

	/**
	 * Checks if the member can become chief
	 * @param userToPromote
	 * @param userGuild
	 * @param guild
	 * @returns boolean
	 */
	function checkMemberEligibility(userToPromote: Entity, userGuild: Guild | null, guild: Guild | null): boolean {

		if (guild === null) {
			sendErrorMessage(
				interaction.user,
				interaction.channel,
				language,
				tr.get("errors.unknownGuild"),
				false,
				interaction
			);
			return false;
		}

		if (!userGuild || userGuild.id !== guild.id) {
			sendErrorMessage(
				interaction.user,
				interaction.channel,
				language,
				tr.get("errors.notInTheGuild"),
				false,
				interaction
			);
			return false;
		}

		if (guild.chiefId === userToPromote.id) {
			sendErrorMessage(
				interaction.user,
				interaction.channel,
				language,
				tr.get("errors.alreadyChief"),
				false,
				interaction
			);
			return false;
		}
		return true;
	}

	let userToPromote;
	try {
		userToPromote = await Entities.getByDiscordUserId(interaction.options.getString("id"));
	}
	catch {
		userToPromote = null;
	}
	if (!userToPromote) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			tr.get("errors.wrongId"),
			false,
			interaction
		);
		return;
	}

	const guild = await Guilds.getByName(interaction.options.getString("guild"));
	const userGuild = await Guilds.getById(userToPromote.Player.guildId);

	if (!checkMemberEligibility(userToPromote, userGuild, guild)) {
		return;
	}

	const endCallback = getEndCallbackChangeChief(userToPromote, guild, interaction, tr);

	new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(tr.get("validation.title"), interaction.user)
		.setDescription(tr.format("validation.description", {
			userID: userToPromote.discordUserId,
			user: await draftBotClient.users.fetch(userToPromote.discordUserId.toString()),
			guild: guild.name
		}))
		.reply(interaction);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("changeguildchief")
		.setDescription("Force a guild to change chief (admin only)")
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