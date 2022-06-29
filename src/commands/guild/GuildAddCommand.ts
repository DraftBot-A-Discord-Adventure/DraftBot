import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {Entities, Entity} from "../../core/models/Entity";
import Guild, {Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {escapeUsername} from "../../core/utils/StringUtils";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

type InvitedUserInformation = { invitedUser: User, invitedEntity: Entity };
type InviterUserInformation = { guild: Guild, entity: Entity };

function getEndCallbackGuildAdd(
	inviter: InviterUserInformation,
	invited: InvitedUserInformation,
	interaction: CommandInteraction,
	guildAddModule: TranslationModule): (msg: DraftBotValidateReactionMessage) => void {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(invited.invitedEntity.discordUserId, BlockingConstants.REASONS.GUILD_ADD);
		if (msg.isValidated()) {
			try {
				inviter.guild = await Guilds.getById(inviter.entity.Player.guildId);
			}
			catch (error) {
				inviter.guild = null;
			}
			if (inviter.guild === null) {
				// guild is destroyed
				return sendErrorMessage(
					invited.invitedUser,
					interaction,
					guildAddModule.language,
					guildAddModule.get("guildDestroy")
				);
			}
			if ((await Entities.getByGuild(inviter.guild.id)).length === Constants.GUILD.MAX_GUILD_MEMBER) {
				sendErrorMessage(
					interaction.user,
					interaction,
					guildAddModule.language,
					guildAddModule.get("guildFull")
				);
				return;
			}
			invited.invitedEntity.Player.guildId = inviter.guild.id;
			inviter.guild.updateLastDailyAt();

			await Promise.all([
				inviter.guild.save(),
				invited.invitedEntity.save(),
				invited.invitedEntity.Player.save()
			]);

			await MissionsController.update(invited.invitedEntity, interaction.channel, guildAddModule.language, {missionId: "joinGuild"});
			await MissionsController.update(invited.invitedEntity, interaction.channel, guildAddModule.language, {
				missionId: "guildLevel",
				count: inviter.guild.level,
				set: true
			});

			interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor(
							guildAddModule.format("successTitle", {
								pseudo: escapeUsername(invited.invitedUser.username),
								guildName: inviter.guild.name
							}),
							invited.invitedUser.displayAvatarURL()
						)
						.setDescription(guildAddModule.get("invitationSuccess"))
				]
			});
			return;
		}

		// Cancel the creation
		sendErrorMessage(invited.invitedUser, interaction, guildAddModule.language,
			guildAddModule.format("invitationCancelled", {guildName: inviter.guild.name}), true);
	};
}

/**
 * Allow to add a member to a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const guildAddModule = Translations.getModule("commands.guildAdd", language);
	const invitedEntity = await Entities.getByOptions(interaction);

	if (invitedEntity.Player.level < Constants.GUILD.REQUIRED_LEVEL) {
		// invited user is low level
		replyErrorMessage(
			interaction,
			language,
			guildAddModule.format("levelTooLow",
				{
					pseudo: invitedEntity.Player.getPseudo(language),
					level: Constants.GUILD.REQUIRED_LEVEL,
					playerLevel: invitedEntity.Player.level,
					comeIn: Constants.GUILD.REQUIRED_LEVEL - invitedEntity.Player.level > 1
						? `${Constants.GUILD.REQUIRED_LEVEL - invitedEntity.Player.level} niveaux`
						: `${Constants.GUILD.REQUIRED_LEVEL - invitedEntity.Player.level} niveau`
				}
			)
		);
		return;
	}

	const invitedUser: User = interaction.options.getUser("user");
	if (await sendBlockedError(interaction, language, invitedUser)) {
		return;
	}

	const guild = await Guilds.getById(entity.Player.guildId);
	// search for the invited's guild
	let invitedGuild;
	try {
		invitedGuild = await Guilds.getById(invitedEntity.Player.guildId);
	}
	catch (error) {
		invitedGuild = null;
	}
	if (invitedGuild !== null) {
		// already in a guild
		replyErrorMessage(
			interaction,
			language,
			guildAddModule.get("alreadyInAGuild")
		);
		return;
	}

	const members = await Entities.getByGuild(guild.id);
	if (members.length === Constants.GUILD.MAX_GUILD_MEMBER) {
		sendErrorMessage(
			interaction.user,
			interaction,
			language,
			guildAddModule.get("guildFull")
		);
		return;
	}

	const endCallback = getEndCallbackGuildAdd(
		{guild, entity},
		{invitedEntity, invitedUser},
		interaction,
		guildAddModule
	);

	new DraftBotValidateReactionMessage(invitedUser, endCallback)
		.formatAuthor(guildAddModule.get("invitationTitle"), invitedUser)
		.setDescription(guildAddModule.format("invitation", {
			guildName: guild.name
		}))
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(invitedEntity.discordUserId, BlockingConstants.REASONS.GUILD_ADD, collector));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildadd")
		.setDescription("Recruit a new member to the guild")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to add in your guild")
			.setRequired(true)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.ELDER,
		guildRequired: true
	},
	mainGuildCommand: false
};