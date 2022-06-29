import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {Entity} from "../../core/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {Tags} from "../../core/models/Tag";
import Potion from "../../core/models/Potion";
import {MissionsController} from "../../core/missions/MissionsController";
import {Maps} from "../../core/Maps";
import {countNbOfPotions} from "../../core/utils/ItemUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {Constants} from "../../core/Constants";
import {InventoryConstants} from "../../core/constants/InventoryConstants";
import {hoursToMinutes} from "../../core/utils/TimeUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

async function drinkNoEffectPotion(entity: Entity, potion: Potion, interaction: CommandInteraction, language: string, tr: TranslationModule) {
	const tagsToVerify = await Tags.findTagsFromObject(potion.id, Potion.name);
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity, interaction.channel, language, {
				missionId: tagsToVerify[i].textTag,
				params: {tags: tagsToVerify}
			});
		}
	}
	await MissionsController.update(entity, interaction.channel, language, {missionId: "drinkPotion"});
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "drinkPotionRarity",
		params: {rarity: potion.rarity}
	});
	await MissionsController.update(entity, interaction.channel, language, {missionId: "drinkPotionWithoutEffect"});
	interaction.replied ?
		sendErrorMessage(interaction.user, interaction, language, tr.get("objectDoNothingError")) :
		replyErrorMessage(interaction, language, tr.get("objectDoNothingError"));
}

async function checkPotionDrinkMissionValidations(entity: Entity, interaction: CommandInteraction, language: string, potion: Potion) {
	await MissionsController.update(entity, interaction.channel, language, {missionId: "drinkPotion"});
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "drinkPotionRarity",
		params: {rarity: potion.rarity}
	});
	const tagsToVerify = await Tags.findTagsFromObject(potion.id, Potion.name);
	if (tagsToVerify) {
		for (let i = 0; i < tagsToVerify.length; i++) {
			await MissionsController.update(entity, interaction.channel, language, {
				missionId: tagsToVerify[i].textTag,
				params: {tags: tagsToVerify}
			});
		}
	}
	await MissionsController.update(entity, interaction.channel, language, {
		missionId: "havePotions",
		count: countNbOfPotions(entity.Player),
		set: true
	});
}

function drinkPotionCallback(entity: Entity, force: boolean, interaction: CommandInteraction, language: string, tr: TranslationModule, embed: DraftBotEmbed) {
	return async (validateMessage: DraftBotValidateReactionMessage, potion: Potion) => {
		if (!force) {
			BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.DRINK);
		}
		if (force !== null && force === true || validateMessage.isValidated()) {
			switch (potion.nature) {
			case Constants.NATURE.NONE:
				if (potion.id === InventoryConstants.POTION_DEFAULT_ID) {
					interaction.replied ?
						sendErrorMessage(interaction.user, interaction, language, tr.get("noActiveObjectDescription")) :
						replyErrorMessage(interaction, language, tr.get("noActiveObjectDescription"));
					return;
				}
				await drinkNoEffectPotion(entity, potion, interaction, language, tr);
				break;
			case Constants.NATURE.HEALTH:
				embed.setDescription(tr.format("healthBonus", {value: potion.power}));
				await entity.addHealth(potion.power, interaction.channel, language);
				break;
			case Constants.NATURE.HOSPITAL:
				embed.setDescription(tr.format("hospitalBonus", {value: potion.power}));
				Maps.advanceTime(entity.Player, hoursToMinutes(potion.power));
				break;
			case Constants.NATURE.MONEY:
				embed.setDescription(tr.format("moneyBonus", {value: potion.power}));
				await entity.Player.addMoney(entity, potion.power, interaction.channel, language);
				break;
			default:
				console.log("Entity", entity.discordUserId, "tried to drink a non defined type potion");
			}
			await entity.Player.drinkPotion();

			await Promise.all([
				entity.save(),
				entity.Player.save()
			]);

			await checkPotionDrinkMissionValidations(entity, interaction, language, potion);

			console.log(entity.discordUserId + " drank " + potion.en);
			interaction.replied ?
				await interaction.channel.send({embeds: [embed]}) :
				await interaction.reply({embeds: [embed]});
			return;
		}
		sendErrorMessage(interaction.user, interaction, language, Translations.getModule("commands.drink", language).get("drinkCanceled"));
	};
}

async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const tr = Translations.getModule("commands.drink", language);
	const potion = await entity.Player.getMainPotionSlot().getItem() as Potion;

	if (potion.id === InventoryConstants.POTION_DEFAULT_ID) {
		replyErrorMessage(interaction, language, tr.get("noActiveObjectDescription"));
		return;
	}
	// Those objects are active only during fights
	if (potion.nature === Constants.NATURE.SPEED || potion.nature === Constants.NATURE.DEFENSE || potion.nature === Constants.NATURE.ATTACK) {
		replyErrorMessage(interaction, language, tr.get("objectIsActiveDuringFights"));
		return;
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(tr.get("drinkSuccess"), interaction.user);
	const force = interaction.options.getBoolean("force");

	const drinkPotion = drinkPotionCallback(entity, force, interaction, language, tr, embed);

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
