import {CommandInteraction} from "discord.js";
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotMissionsMessageBuilder} from "../../core/messages/DraftBotMissionsMessage";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import {MissionSlots} from "../../core/database/game/models/MissionSlot";
import {PlayerMissionsInfos} from "../../core/database/game/models/PlayerMissionsInfo";

/**
 * Shows the missions of the given player (default : the one who entered the command)
 * @param interaction
 * @param language
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	let entityToLook = await Players.getByOptions(interaction);
	if (entityToLook === null) {
		entityToLook = player;
	}

	if (interaction.user.id === entityToLook.discordUserId) {
		player = await MissionsController.update(player, interaction.channel, language, {missionId: "commandMission"});
	}
	player = await Players.getById(player.id);

	await MissionsController.checkCompletedMissions(player, await MissionSlots.getOfPlayer(player.id), await PlayerMissionsInfos.getOfPlayer(player.id), interaction.channel, language);
	if (entityToLook.discordUserId === player.discordUserId) {
		[entityToLook] = await Players.getOrRegister(entityToLook.discordUserId);
	}
	await interaction.reply({
		embeds: [
			await new DraftBotMissionsMessageBuilder(
				entityToLook,
				interaction.user,
				language
			).build()
		]
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.missions", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.missions", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
