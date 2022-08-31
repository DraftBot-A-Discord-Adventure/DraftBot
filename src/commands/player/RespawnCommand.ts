import {MapLinks} from "../../core/database/game/models/MapLink";
import {Maps} from "../../core/Maps";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import Entity from "../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {RespawnConstants} from "../../core/constants/RespawnConstants";

/**
 * Allow a player who is dead to respawn
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const respawnModule = Translations.getModule("commands.respawn", language);
	if (entity.Player.effect !== EffectsConstants.EMOJI_TEXT.DEAD) {
		await replyErrorMessage(interaction, language, respawnModule.format("alive", {pseudo: await entity.Player.getPseudo(language)}));
		return;
	}
	const lostScore = Math.round(entity.Player.score * RespawnConstants.SCORE_REMOVAL_MULTIPLIER);
	await entity.addHealth(await entity.getMaxHealth() - entity.health, interaction.channel, language, NumberChangeReason.RESPAWN);
	await entity.Player.addScore(entity, -lostScore, interaction.channel, language, NumberChangeReason.RESPAWN);

	await Promise.all([
		entity.save(),
		entity.Player.save()
	]);

	await Maps.removeEffect(entity.Player, NumberChangeReason.RESPAWN);
	await Maps.stopTravel(entity.Player);
	const newlink = await MapLinks.getLinkByLocations(
		await entity.Player.getPreviousMapId(),
		await entity.Player.getDestinationId()
	);
	await Maps.startTravel(entity.Player, newlink, interaction.createdAt.valueOf(), NumberChangeReason.RESPAWN);

	await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);

	await interaction.reply({
		content: respawnModule.format("respawn", {
			pseudo: escapeUsername(interaction.user.username),
			lostScore: lostScore
		})
	});

}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("respawn")
		.setDescription("Revives you at the cost of points."),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};
