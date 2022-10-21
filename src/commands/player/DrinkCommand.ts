import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import Potion from "../../core/database/game/models/Potion";
import {checkDrinkPotionMissions} from "../../core/utils/ItemUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {Constants} from "../../core/Constants";
import {InventoryConstants} from "../../core/constants/InventoryConstants";
import {minutesDisplay} from "../../core/utils/TimeUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {TravelTime} from "../../core/maps/TravelTime";
import Player from "../../core/database/game/models/Player";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";

type TextInformation = { tr: TranslationModule, interaction: CommandInteraction }

/**
 * Consumes the given potion
 * @param potion
 * @param embed
 * @param player
 * @param textInformation
 */
async function consumePotion(potion: Potion, embed: DraftBotEmbed, player: Player, textInformation: TextInformation): Promise<void> {
	switch (potion.nature) {
	case Constants.NATURE.HEALTH:
		embed.setDescription(textInformation.tr.format("healthBonus", {value: potion.power}));
		await player.addHealth(potion.power, textInformation.interaction.channel, textInformation.tr.language, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.HOSPITAL:
		embed.setDescription(textInformation.tr.format("hospitalBonus", {value: minutesDisplay(potion.power, textInformation.tr.language)}));
		await TravelTime.timeTravel(player, potion.power, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.MONEY:
		embed.setDescription(textInformation.tr.format("moneyBonus", {value: potion.power}));
		await player.addMoney({
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
	await player.drinkPotion();

	await player.save();
}

/**
 * Returns the callback for the drink command
 * @param player
 * @param force
 * @param textInformation
 * @param embed
 */
function drinkPotionCallback(
	player: Player,
	force: boolean,
	textInformation: TextInformation,
	embed: DraftBotEmbed
): (validateMessage: DraftBotValidateReactionMessage, potion: Potion) => Promise<void> {
	return async (validateMessage: DraftBotValidateReactionMessage, potion: Potion): Promise<void> => {
		if (!force) {
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.DRINK);
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

		await consumePotion(potion, embed, player, textInformation);
		await checkDrinkPotionMissions(textInformation.interaction.channel, textInformation.tr.language, player, potion, await InventorySlots.getOfPlayer(player.id));

		textInformation.interaction.replied ?
			await textInformation.interaction.channel.send({embeds: [embed]}) :
			await textInformation.interaction.reply({embeds: [embed]});
	};
}

/**
 * Drink the current main potion, if possible
 * @param interaction
 * @param language
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const tr = Translations.getModule("commands.drink", language);
	const potion = await (await InventorySlots.getMainPotionSlot(player.id)).getItem() as Potion;

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

	const drinkPotion = drinkPotionCallback(player, force, {interaction, tr}, embed);

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
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.DRINK, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.drink", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.drink", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addBooleanOption(
			option => option.setName(currentCommandEnglishTranslations.get("optionForceName"))
				.setNameLocalizations({
					fr: currentCommandFrenchTranslations.get("optionForceName")
				})
				.setDescription(currentCommandEnglishTranslations.get("optionForceDescription"))
				.setDescriptionLocalizations({
					fr: currentCommandFrenchTranslations.get("optionForceDescription")
				})
				.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};
