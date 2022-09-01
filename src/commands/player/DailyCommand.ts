import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/database/game/models/Entity";

import {Maps} from "../../core/Maps";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {hoursToMinutes, millisecondsToHours, minutesDisplay} from "../../core/utils/TimeUtils";
import ObjectItem from "../../core/database/game/models/ObjectItem";
import {TranslationModule, Translations} from "../../core/Translations";
import {DailyConstants} from "../../core/constants/DailyConstants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {InventoryConstants} from "../../core/constants/InventoryConstants";

type EntityInformation = { entity: Entity, activeObject: ObjectItem };
type TextInformation = { dailyModule: TranslationModule, interaction: CommandInteraction, language: string };

/**
 * Checks if you have a right object you can daily with, and if you don't, sends an error
 * @param activeObject
 * @param interaction
 * @param language
 * @param dailyModule
 */
async function isWrongObjectForDaily(activeObject: ObjectItem, interaction: CommandInteraction, language: string, dailyModule: TranslationModule): Promise<boolean> {
	if (activeObject.nature === Constants.NATURE.NONE) {
		if (activeObject.id !== InventoryConstants.OBJECT_DEFAULT_ID) {
			// there is an object that do nothing in the inventory
			await replyErrorMessage(interaction, language, dailyModule.get("objectDoNothingError"));
			return true;
		}
		// there is no object in the inventory
		await replyErrorMessage(interaction, language, dailyModule.get("noActiveObjectDescription"));
		return true;
	}
	if ([Constants.NATURE.SPEED, Constants.NATURE.DEFENSE, Constants.NATURE.ATTACK].indexOf(activeObject.nature) !== -1) {
		// Those objects are active only during fights
		await replyErrorMessage(
			interaction,
			language,
			dailyModule.get("objectIsActiveDuringFights")
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
async function dailyNotReady(interaction: CommandInteraction, entity: Entity, language: string, dailyModule: TranslationModule): Promise<boolean> {
	const time = millisecondsToHours(interaction.createdAt.valueOf() - entity.Player.InventoryInfo.lastDailyAt.valueOf());
	if (time < DailyConstants.TIME_BETWEEN_DAILIES) {
		await replyErrorMessage(
			interaction,
			language,
			dailyModule.format("coolDown", {
				coolDownTime: DailyConstants.TIME_BETWEEN_DAILIES,
				time: minutesDisplay(hoursToMinutes(DailyConstants.TIME_BETWEEN_DAILIES - time))
			})
		);
		return true;
	}
	return false;
}

/**
 * Activates the daily item
 * @param entityInformation
 * @param embed
 * @param textInformation
 */
async function activateDailyItem(
	entityInformation: EntityInformation,
	embed: DraftBotEmbed,
	textInformation: TextInformation): Promise<void> {
	switch (entityInformation.activeObject.nature) {
	case Constants.NATURE.HEALTH:
		embed.setDescription(textInformation.dailyModule.format("healthDaily", {value: entityInformation.activeObject.power}));
		await entityInformation.entity.addHealth(entityInformation.activeObject.power, textInformation.interaction.channel, textInformation.language, NumberChangeReason.DAILY);
		break;
	case Constants.NATURE.HOSPITAL:
		embed.setDescription(
			textInformation.dailyModule.format("hospitalBonus", {
				value: minutesDisplay(entityInformation.activeObject.power)
			})
		);
		await Maps.advanceTime(entityInformation.entity.Player, entityInformation.activeObject.power, NumberChangeReason.DAILY);
		break;
	case Constants.NATURE.MONEY:
		embed.setDescription(textInformation.dailyModule.format("moneyBonus", {value: entityInformation.activeObject.power}));
		await entityInformation.entity.Player.addMoney(
			entityInformation.entity,
			entityInformation.activeObject.power,
			textInformation.interaction.channel,
			textInformation.language,
			NumberChangeReason.DAILY
		);
		break;
	default:
		break;
	}
	entityInformation.entity.Player.InventoryInfo.updateLastDailyAt();
	await Promise.all([entityInformation.entity.save(), entityInformation.entity.Player.save(), entityInformation.entity.Player.InventoryInfo.save()]);
}

/**
 * Activate your daily item effect
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const dailyModule = Translations.getModule("commands.daily", language);

	const activeObject: ObjectItem = await entity.Player.getMainObjectSlot().getItem() as ObjectItem;

	if (await isWrongObjectForDaily(activeObject, interaction, language, dailyModule) || await dailyNotReady(interaction, entity, language, dailyModule)) {
		return;
	}

	const embed = new DraftBotEmbed().formatAuthor(dailyModule.get("dailySuccess"), interaction.user);
	await activateDailyItem({entity, activeObject}, embed, {interaction, language, dailyModule});
	await interaction.reply({embeds: [embed]});

	// TODO CREER TABLE LOG DAILY
	// log(entity.discordUserId + " used his daily item " + activeObject.en);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("Activate your daily item effect"),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
