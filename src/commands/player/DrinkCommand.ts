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

type TextInformations = { tr: TranslationModule, interaction: CommandInteraction }

/**
 * Consumes the given potion
 * @param potion
 * @param embed
 * @param entity
 * @param textInformations
 */
async function consumePotion(potion: Potion, embed: DraftBotEmbed, entity: Entity, textInformations: TextInformations) {
	switch (potion.nature) {
	case Constants.NATURE.HEALTH:
		embed.setDescription(textInformations.tr.format("healthBonus", {value: potion.power}));
		await entity.addHealth(potion.power, textInformations.interaction.channel, textInformations.tr.language, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.HOSPITAL:
		embed.setDescription(textInformations.tr.format("hospitalBonus", {value: minutesDisplay(potion.power, textInformations.tr.language)}));
		await Maps.advanceTime(entity.Player, potion.power, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.MONEY:
		embed.setDescription(textInformations.tr.format("moneyBonus", {value: potion.power}));
		await entity.Player.addMoney(entity, potion.power, textInformations.interaction.channel, textInformations.tr.language, NumberChangeReason.DRINK);
		break;
	case Constants.NATURE.NONE:
		embed.setDescription(textInformations.tr.format("noBonus", {value: potion.power}));
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
 * @param textInformations
 * @param embed
 */
function drinkPotionCallback(entity: Entity, force: boolean, textInformations: TextInformations, embed: DraftBotEmbed) {
	return async (validateMessage: DraftBotValidateReactionMessage, potion: Potion) => {
		if (!force) {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.DRINK);
		}
		if (!force && !validateMessage.isValidated()) {
			await sendErrorMessage(
				textInformations.interaction.user,
				textInformations.interaction,
				textInformations.tr.language,
				Translations.getModule("commands.drink", textInformations.tr.language).get("drinkCanceled"),
				true
			);
			return;
		}
		if (potion.id === InventoryConstants.POTION_DEFAULT_ID) {
			textInformations.interaction.replied ?
				await sendErrorMessage(textInformations.interaction.user, textInformations.interaction, textInformations.tr.language, textInformations.tr.get("noActiveObjectDescription")) :
				await replyErrorMessage(textInformations.interaction, textInformations.tr.language, textInformations.tr.get("noActiveObjectDescription"));
			return;
		}

		await consumePotion(potion, embed, entity, textInformations);
		await checkDrinkPotionMissions(textInformations.interaction.channel, textInformations.tr.language, entity, potion);

		console.log(entity.discordUserId + " drank " + potion.en);
		textInformations.interaction.replied ?
			await textInformations.interaction.channel.send({embeds: [embed]}) :
			await textInformations.interaction.reply({embeds: [embed]});
	};
}

async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
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
	const force = interaction.options.getBoolean("force");

	const drinkPotion = drinkPotionCallback(entity, force, {interaction, tr}, embed);

	if (force !== null && force === true) {
		await drinkPotion(null, potion);
		return;
	}

	await new DraftBotValidateReactionMessage(interaction.user, (msg) => drinkPotion(msg as DraftBotValidateReactionMessage, potion))
		.formatAuthor(tr.get("confirmationTitle"), interaction.user)
		.setDescription(tr.format("confirmation", {
			potion: potion.getName(language),
			effect: potion.getNatureTranslation(language)
		}))
		.setFooter(tr.get("confirmationFooter"))
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.DRINK, collector));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("drink")
		.setDescription("Drink your equiped potion")
		.addBooleanOption(option => option.setName("force")
			.setRequired(false)
			.setDescription("If true, skips the validation phase if you are really sure you want to drink the potion")
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};
