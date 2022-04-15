import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {hoursToMinutes, millisecondsToHours, minutesDisplay} from "../../core/utils/TimeUtils";
import ObjectItem from "../../core/models/ObjectItem";
import {Data} from "../../core/Data";
import {TranslationModule, Translations} from "../../core/Translations";
import {DailyConstants} from "../../core/constants/DailyConstants";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Checks if you have a right object you can daily with, and if you don't, sends an error
 * @param activeObject
 * @param interaction
 * @param language
 * @param dailyModule
 */
function isWrongObjectForDaily(activeObject: ObjectItem, interaction: CommandInteraction, language: string, dailyModule: TranslationModule) {
	if (activeObject.nature === Constants.NATURE.NONE) {
		if (activeObject.id !== Data.getModule("models.inventories").getNumber("objectId")) {
			// there is an object that do nothing in the inventory
			sendErrorMessage(interaction.user, interaction.channel, language, dailyModule.get("objectDoNothingError"), false, interaction);
			return true;
		}
		// there is no object in the inventory
		sendErrorMessage(interaction.user, interaction.channel, language, dailyModule.get("noActiveObjectdescription"), false, interaction);
		return true;
	}
	if (activeObject.nature in [Constants.NATURE.SPEED, Constants.NATURE.DEFENSE, Constants.NATURE.ATTACK]) {
		// Those objects are active only during fights
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			dailyModule.get("objectIsActiveDuringFights"),
			false,
			interaction
		);
		return true;
	}
	return false;
}

/**
 * Checks if you can do your daily, and if you can't, sends an error
 * @param interaction
 * @param entity
 * @param language
 * @param dailyModule
 */
function dailyNotReady(interaction: CommandInteraction, entity: Entity, language: string, dailyModule: TranslationModule) {
	const time = millisecondsToHours(interaction.createdAt.valueOf() - entity.Player.InventoryInfo.lastDailyAt.valueOf());
	if (time < DailyConstants.TIME_BETWEEN_DAILIES) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			dailyModule.format("coolDown", {
				coolDownTime: DailyConstants.TIME_BETWEEN_DAILIES,
				time: minutesDisplay(hoursToMinutes(DailyConstants.TIME_BETWEEN_DAILIES - time))
			}),
			false,
			interaction
		);
		return true;
	}
	return false;
}

/**
 * Activate your daily item effect
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const dailyModule = Translations.getModule("commands.daily", language);

	const activeObject: ObjectItem = await entity.Player.getMainObjectSlot().getItem() as ObjectItem;

	if (isWrongObjectForDaily(activeObject, interaction, language, dailyModule) || dailyNotReady(interaction, entity, language, dailyModule)) {
		return;
	}

	const embed = new DraftBotEmbed().formatAuthor(dailyModule.get("dailySuccess"), interaction.user);

	switch (activeObject.nature) {
	case Constants.NATURE.HEALTH:
		embed.setDescription(dailyModule.format("healthDaily", {value: activeObject.power}));
		await entity.addHealth(activeObject.power, interaction.channel, language);
		break;
	case Constants.NATURE.HOSPITAL:
		embed.setDescription(
			dailyModule.format("hospitalBonus", {
				value: minutesDisplay(hoursToMinutes(activeObject.power))
			})
		);
		Maps.advanceTime(entity.Player, hoursToMinutes(activeObject.power));
		break;
	case Constants.NATURE.MONEY:
		embed.setDescription(dailyModule.format("moneyBonus", {value: activeObject.power}));
		await entity.Player.addMoney(entity, activeObject.power, interaction.channel, language);
		break;
	default:
		break;
	}

	entity.Player.InventoryInfo.updateLastDailyAt();
	await Promise.all([entity.save(), entity.Player.save(), entity.Player.InventoryInfo.save()]);
	// TODO REFACTOR LES LOGS
	// log(entity.discordUserId + " used his daily item " + activeObject.en);
	await interaction.reply({embeds: [embed]});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("Activate your daily item effect"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};
