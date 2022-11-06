import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
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
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";

type InvitedUserInformation = { invitedUser: User, invitedPlayer: Player };
type InviterUserInformation = { guild: Guild, player: Player };

/**
 * Get the callback for the guild add command
 * @param inviter
 * @param invited
 * @param interaction
 * @param guildInviteModule
 */
function getEndCallbackGuildAdd(
	inviter: InviterUserInformation,
	invited: InvitedUserInformation,
	interaction: CommandInteraction,
	guildInviteModule: TranslationModule): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(invited.invitedPlayer.discordUserId, BlockingConstants.REASONS.GUILD_ADD);
		if (!msg.isValidated()) {
			// Cancel the creation
			await sendErrorMessage(invited.invitedUser, interaction, guildInviteModule.language,
				guildInviteModule.format("invitationCancelled", {guildName: inviter.guild.name}), true);
			return;
		}
		try {
			inviter.guild = await Guilds.getById(inviter.player.guildId);
		}
		catch (error) {
			inviter.guild = null;
		}

		// check if the inviter is still in the guild (aka the guild still exists and the inviter is still in it)
		if (inviter.guild === null) {
			// guild is destroyed
			await sendErrorMessage(
				invited.invitedUser,
				interaction,
				guildInviteModule.language,
				guildInviteModule.get("guildDestroy"),
				false,
				false
			);
			return;
		}

		// check if the guild is full
		if ((await Players.getByGuild(inviter.guild.id)).length === Constants.GUILD.MAX_GUILD_MEMBER) {
			await sendErrorMessage(
				interaction.user,
				interaction,
				guildInviteModule.language,
				guildInviteModule.get("guildFull")
			);
			return;
		}

		// check if the invited player is dead
		if (invited.invitedPlayer.isDead()) {
			await sendErrorMessage(
				invited.invitedUser,
				interaction,
				guildInviteModule.language,
				guildInviteModule.format("playerDead", {}),
				false,
				false
			);
			return;
		}

		invited.invitedPlayer.guildId = inviter.guild.id;
		inviter.guild.updateLastDailyAt();

		await Promise.all([
			inviter.guild.save(),
			invited.invitedPlayer.save()
		]);

		draftBotInstance.logsDatabase.logGuildJoin(inviter.player.discordUserId, invited.invitedPlayer.discordUserId, inviter.guild).then();

		await MissionsController.update(invited.invitedPlayer, interaction.channel, guildInviteModule.language, {missionId: "joinGuild"});
		await MissionsController.update(invited.invitedPlayer, interaction.channel, guildInviteModule.language, {
			missionId: "guildLevel",
			count: inviter.guild.level,
			set: true
		});

		interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.setAuthor(
						{
							name: guildInviteModule.format("successTitle", {
								pseudo: escapeUsername(invited.invitedUser.username),
								guildName: inviter.guild.name
							}),
							iconURL: invited.invitedUser.displayAvatarURL()
						}
					)
					.setDescription(guildInviteModule.get("invitationSuccess"))
			]
		});
	};
}

/**
 * Allow to add a member to a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	const guildInviteModule = Translations.getModule("commands.guildInvite", language);
	const invitedPlayer = await Players.getByOptions(interaction);

	if (invitedPlayer.level < Constants.GUILD.REQUIRED_LEVEL) {
		// invited user is low level
		await replyErrorMessage(
			interaction,
			language,
			guildInviteModule.format("levelTooLow",
				{
					pseudo: invitedPlayer.getPseudo(language),
					level: Constants.GUILD.REQUIRED_LEVEL,
					playerLevel: invitedPlayer.level,
					comeIn: Constants.GUILD.REQUIRED_LEVEL - invitedPlayer.level > 1
						? `${Constants.GUILD.REQUIRED_LEVEL - invitedPlayer.level} niveaux`
						: `${Constants.GUILD.REQUIRED_LEVEL - invitedPlayer.level} niveau`
				}
			)
		);
		return;
	}

	const invitedUser: User = interaction.options.getUser("user");
	if (await sendBlockedError(interaction, language, invitedUser)) {
		return;
	}

	const guild = await Guilds.getById(player.guildId);
	// search for the invited's guild
	let invitedGuild;
	try {
		invitedGuild = await Guilds.getById(invitedPlayer.guildId);
	}
	catch (error) {
		invitedGuild = null;
	}
	if (invitedGuild !== null) {
		// already in a guild
		await replyErrorMessage(
			interaction,
			language,
			guildInviteModule.get("alreadyInAGuild")
		);
		return;
	}

	const members = await Players.getByGuild(guild.id);
	if (members.length === Constants.GUILD.MAX_GUILD_MEMBER) {
		await sendErrorMessage(
			interaction.user,
			interaction,
			language,
			guildInviteModule.get("guildFull")
		);
		return;
	}

	const endCallback = getEndCallbackGuildAdd(
		{guild, player: player},
		{invitedPlayer: invitedPlayer, invitedUser},
		interaction,
		guildInviteModule
	);

	await new DraftBotValidateReactionMessage(invitedUser, endCallback)
		.formatAuthor(guildInviteModule.get("invitationTitle"), invitedUser)
		.setDescription(guildInviteModule.format("invitation", {
			guildName: guild.name
		}))
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(invitedPlayer.discordUserId, BlockingConstants.REASONS.GUILD_ADD, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildInvite", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildInvite", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(true)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.ELDER,
		guildRequired: true
	},
	mainGuildCommand: false
};