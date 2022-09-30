import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {Entity} from "../../core/database/game/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import Potion from "../../core/database/game/models/Potion";
import {Maps} from "../../core/Maps";
import {checkDrinkPotionMissions} from "../../core/utils/ItemUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {Constants} from "../../core/Constants";
import {InventoryConstants} from "../../core/constants/InventoryConstants";
import {minutesDisplay} from "../../core/utils/TimeUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

type TextInformation = { tr: TranslationModule, interaction: CommandInteraction }

/**
 * Consumes the given potion
 * @param potion
 * @param embed
 * @param entity
 * @param textInformation
 */
async function consumePotion(potion: Potion, embed: DraftBotEmbed, entity: Entity, textInformation: TextInformation): Promise<void> {
	switch (potion.nature) {
	case Constants.NATURE.HEALTH:
		embed.setDescription(textInformation.tr.format("healthBonus", {value: potion.power}));
		await entity.addHealth(potion.power, textInformation.interaction.channel, textInformation.tr.language, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.HOSPITAL:
		embed.setDescription(textInformation.tr.format("hospitalBonus", {value: minutesDisplay(potion.power, textInformation.tr.language)}));
		await Maps.advanceTime(entity.Player, potion.power, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.MONEY:
		embed.setDescription(textInformation.tr.format("moneyBonus", {value: potion.power}));
		await entity.Player.addMoney({
			entity,
			amount: potion.power,
			channel: textInformation.interaction.channel,
			language: textInformation.tr.language,
			reason: NumberChangeReason.DRINK
		});
		break;
	case Constants.NATURE.NONE:
		embed.setDescription(textInformation.tr.format("noBonus", {value: potion.power}));
		break;
	default:
		break;
	}
	await entity.Player.drinkPotion();

	await Promise.all([
		entity.save(),
		entity.Player.save()
	]);
}

/**
 * Returns the callback for the drink command
 * @param entity
 * @param force
 * @param textInformation
 * @param embed
 */
function drinkPotionCallback(
	entity: Entity,
	force: boolean,
	textInformation: TextInformation,
	embed: DraftBotEmbed
): (validateMessage: DraftBotValidateReactionMessage, potion: Potion) => Promise<void> {
	return async (validateMessage: DraftBotValidateReactionMessage, potion: Potion): Promise<void> => {
		if (!force) {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.DRINK);
		}
		if (!force && !validateMessage.isValidated()) {
			await sendErrorMessage(
				textInformation.interaction.user,
				textInformation.interaction,
				textInformation.tr.language,
				Translations.getModule("commands.drink", textInformation.tr.language).get("drinkCanceled"),
				true
			);
			return;
		}
		if (potion.id === InventoryConstants.POTION_DEFAULT_ID) {
			textInformation.interaction.replied ?
				await sendErrorMessage(textInformation.interaction.user, textInformation.interaction, textInformation.tr.language, textInformation.tr.get("noActiveObjectDescription")) :
				await replyErrorMessage(textInformation.interaction, textInformation.tr.language, textInformation.tr.get("noActiveObjectDescription"));
			return;
		}

		await consumePotion(potion, embed, entity, textInformation);
		await checkDrinkPotionMissions(textInformation.interaction.channel, textInformation.tr.language, entity, potion);

		textInformation.interaction.replied ?
			await textInformation.interaction.channel.send({embeds: [embed]}) :
			await textInformation.interaction.reply({embeds: [embed]});
	};
}

/**
 * Drink the current main potion, if possible
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const tr = Translations.getModule("commands.drink", language);
	const potion = await entity.Player.getMainPotionSlot().getItem() as Potion;

	if (potion.id === InventoryConstants.POTION_DEFAULT_ID) {
		await replyErrorMessage(interaction, language, tr.get("noActiveObjectDescription"));
		return;
	}
	// Those objects are active only during fights
	if (potion.nature === Constants.NATURE.SPEED || potion.nature === Constants.NATURE.DEFENSE || potion.nature === Constants.NATURE.ATTACK) {
		await replyErrorMessage(interaction, language, tr.get("objectIsActiveDuringFights"));
		return;
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(tr.get("drinkSuccess"), interaction.user);
	const force = interaction.options.get("force") ? interaction.options.get("force").value as boolean : false;

	const drinkPotion = drinkPotionCallback(entity, force, {interaction, tr}, embed);

	if (force) {
		await drinkPotion(null, potion);
		return;
	}

	await new DraftBotValidateReactionMessage(interaction.user, (msg) => drinkPotion(msg as DraftBotValidateReactionMessage, potion))
		.formatAuthor(tr.get("confirmationTitle"), interaction.user)
		.setDescription(tr.format("confirmation", {
			potion: potion.getName(language),
			effect: potion.getNatureTranslation(language)
		}))
		.setFooter({text: tr.get("confirmationFooter")})
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.DRINK, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.drink", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.drink", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addBooleanOption(option => option.setName("force")
			.setRequired(false)
			.setDescription("If true, skips the validation phase if you are really sure you want to drink the potion")
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};
