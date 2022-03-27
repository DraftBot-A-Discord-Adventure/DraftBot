import {MapLinks} from "../../core/models/MapLink";
import {Maps} from "../../core/Maps";
import {PlayerSmallEvents} from "../../core/models/PlayerSmallEvent";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import Entity from "../../core/models/Entity";
import {CommandInteraction} from "discord.js";
import {Data} from "../../core/Data";
import {Translations} from "../../core/Translations";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Allow a player who is dead to respawn
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction.user, interaction.channel, language, interaction)) {
		return;
	}
	const respawnModule = Translations.getModule("commands.respawn", language);
	const lostScore = Math.round(entity.Player.score * Data.getModule("commands.respawn").getNumber("score_remove_during_respawn"));
	entity.health = await entity.getMaxHealth();
	await entity.Player.addScore(entity, -lostScore, interaction.channel, language);

	await Promise.all([
		entity.save(),
		entity.Player.save()
	]);

	await Maps.removeEffect(entity.Player);
	await Maps.stopTravel(entity.Player);
	const newlink = await MapLinks.getLinkByLocations(
		await entity.Player.getPreviousMapId(),
		await entity.Player.getDestinationId()
	);
	await Maps.startTravel(entity.Player, newlink, interaction.createdAt.valueOf());

	await PlayerSmallEvents.removeSmallEventsOfPlayer(entity.Player.id);

	await interaction.reply({
		content: respawnModule.format("respawn", {
			pseudo: escapeUsername(interaction.user.username),
			lostScore: lostScore
		})
	});
	// TODO REFAIRE LES LOGS
	// log(message.author.id + " respawned (" + lostScore + " points lost)");

}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("respawn")
		.setDescription("Revives you at the cost of points."),
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.DEAD],
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
