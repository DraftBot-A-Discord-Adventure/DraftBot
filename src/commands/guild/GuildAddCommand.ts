import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {Entities, Entity} from "../../core/database/game/models/Entity";
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

type InvitedUserInformation = { invitedUser: User, invitedEntity: Entity };
type InviterUserInformation = { guild: Guild, entity: Entity };

/**
 * Get the callback for the guild add command
 * @param inviter
 * @param invited
 * @param interaction
 * @param guildAddModule
 */
function getEndCallbackGuildAdd(
	inviter: InviterUserInformation,
	invited: InvitedUserInformation,
	interaction: CommandInteraction,
	guildAddModule: TranslationModule): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(invited.invitedEntity.discordUserId, BlockingConstants.REASONS.GUILD_ADD);
		if (!msg.isValidated()) {
			// Cancel the creation
			await sendErrorMessage(invited.invitedUser, interaction, guildAddModule.language,
				guildAddModule.format("invitationCancelled", {guildName: inviter.guild.name}), true);
			return;
		}
		try {
			inviter.guild = await Guilds.getById(inviter.entity.Player.guildId);
		}
		catch (error) {
			inviter.guild = null;
		}
		if (inviter.guild === null) {
			// guild is destroyed
			await sendErrorMessage(
				invited.invitedUser,
				interaction,
				guildAddModule.language,
				guildAddModule.get("guildDestroy")
			);
			return;
		}
		if ((await Entities.getByGuild(inviter.guild.id)).length === Constants.GUILD.MAX_GUILD_MEMBER) {
			await sendErrorMessage(
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

		draftBotInstance.logsDatabase.logGuildJoin(inviter.entity.discordUserId, invited.invitedEntity.discordUserId, inviter.guild).then();

		await MissionsController.update(invited.invitedEntity, interaction.channel, guildAddModule.language, {missionId: "joinGuild"});
		await MissionsController.update(invited.invitedEntity, interaction.channel, guildAddModule.language, {
			missionId: "guildLevel",
			count: inviter.guild.level,
			set: true
		});

		interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.setAuthor(
						{
							name: guildAddModule.format("successTitle", {
								pseudo: escapeUsername(invited.invitedUser.username),
								guildName: inviter.guild.name
							}),
							iconURL: invited.invitedUser.displayAvatarURL()
						}
					)
					.setDescription(guildAddModule.get("invitationSuccess"))
			]
		});
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
		await replyErrorMessage(
			interaction,
			language,
			guildAddModule.format("levelTooLow",
				{
					pseudo: await invitedEntity.Player.getPseudo(language),
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
		await replyErrorMessage(
			interaction,
			language,
			guildAddModule.get("alreadyInAGuild")
		);
		return;
	}

	const members = await Entities.getByGuild(guild.id);
	if (members.length === Constants.GUILD.MAX_GUILD_MEMBER) {
		await sendErrorMessage(
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

	await new DraftBotValidateReactionMessage(invitedUser, endCallback)
		.formatAuthor(guildAddModule.get("invitationTitle"), invitedUser)
		.setDescription(guildAddModule.format("invitation", {
			guildName: guild.name
		}))
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(invitedEntity.discordUserId, BlockingConstants.REASONS.GUILD_ADD, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildAdd", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildAdd", Constants.LANGUAGE.ENGLISH);
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