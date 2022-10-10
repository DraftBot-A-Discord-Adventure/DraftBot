import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {hoursToMinutes, millisecondsToHours, minutesDisplay} from "../../core/utils/TimeUtils";
import ObjectItem from "../../core/database/game/models/ObjectItem";
import {TranslationModule, Translations} from "../../core/Translations";
import {DailyConstants} from "../../core/constants/DailyConstants";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {InventoryConstants} from "../../core/constants/InventoryConstants";
import {draftBotInstance} from "../../core/bot";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {TravelTime} from "../../core/maps/TravelTime";
import Player from "../../core/database/game/models/Player";
import {InventoryInfos} from "../../core/database/game/models/InventoryInfo";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";

type EntityInformation = { player: Player, activeObject: ObjectItem };
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
 * @param player
 * @param language
 * @param dailyModule
 */
async function dailyNotReady(interaction: CommandInteraction, player: Player, language: string, dailyModule: TranslationModule): Promise<boolean> {
	const inventoryInfo = await InventoryInfos.getOfPlayer(player.id);
	const time = millisecondsToHours(interaction.createdAt.valueOf() - inventoryInfo.lastDailyAt.valueOf());
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
		await entityInformation.player.addHealth(entityInformation.activeObject.power, textInformation.interaction.channel, textInformation.language, NumberChangeReason.DAILY);
		break;
	case Constants.NATURE.HOSPITAL:
		embed.setDescription(
			textInformation.dailyModule.format("hospitalBonus", {
				value: minutesDisplay(entityInformation.activeObject.power)
			})
		);
		await TravelTime.timeTravel(entityInformation.player, entityInformation.activeObject.power, NumberChangeReason.DAILY);
		break;
	case Constants.NATURE.MONEY:
		embed.setDescription(textInformation.dailyModule.format("moneyBonus", {value: entityInformation.activeObject.power}));
		await entityInformation.player.addMoney({
			amount: entityInformation.activeObject.power,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.DAILY
		});
		break;
	default:
		break;
	}
	const inventoryInfo = await InventoryInfos.getOfPlayer(entityInformation.player.id);
	inventoryInfo.updateLastDailyAt();
	await Promise.all([entityInformation.player.save(), entityInformation.player.save(), inventoryInfo.save()]);
}

/**
 * Activate your daily item effect
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const dailyModule = Translations.getModule("commands.daily", language);

	const activeObject: ObjectItem = await (await InventorySlots.getMainObjectSlot(player.id)).getItem() as ObjectItem;

	if (await isWrongObjectForDaily(activeObject, interaction, language, dailyModule) || await dailyNotReady(interaction, player, language, dailyModule)) {
		return;
	}

	const embed = new DraftBotEmbed().formatAuthor(dailyModule.get("dailySuccess"), interaction.user);
	await activateDailyItem({player: player, activeObject}, embed, {interaction, language, dailyModule});
	await interaction.reply({embeds: [embed]});

	draftBotInstance.logsDatabase.logPlayerDaily(player.discordUserId, activeObject).then();
}

const currentCommandFrenchTranslations = Translations.getModule("commands.daily", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.daily", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
