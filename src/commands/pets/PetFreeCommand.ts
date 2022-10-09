import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Entity from "../../core/database/game/models/Entity";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {PetFreeConstants} from "../../core/constants/PetFreeConstants";
import {millisecondsToMinutes, minutesDisplay} from "../../core/utils/TimeUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {getFoodIndexOf} from "../../core/utils/FoodUtils";
import {RandomUtils} from "../../core/utils/RandomUtils";
import PetEntity from "../../core/database/game/models/PetEntity";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {LogsDatabase, NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Say if you win a meat piece for freeing your pet
 * @param guild
 * @param pPet
 */
function luckyMeat(guild: Guild, pPet: PetEntity): boolean {
	return guild.carnivorousFood + 1 <= Constants.GUILD.MAX_PET_FOOD[getFoodIndexOf(Constants.PET_FOOD.CARNIVOROUS_FOOD)]
		&& RandomUtils.draftbotRandom.realZeroToOneInclusive() <= PetFreeConstants.GIVE_MEAT_PROBABILITY
		&& !pPet.isFeisty();
}

/**
 * Get the callback for the pet free command
 * @param entity
 * @param pPet
 * @param petFreeModule
 * @param interaction
 */
function getPetFreeEndCallback(entity: Entity, pPet: PetEntity, petFreeModule: TranslationModule, interaction: CommandInteraction) {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.PET_FREE);
		if (msg.isValidated()) {
			if (pPet.isFeisty()) {
				await entity.Player.addMoney({
					entity,
					amount: -PetFreeConstants.FREE_FEISTY_COST,
					channel: interaction.channel,
					language: petFreeModule.language,
					reason: NumberChangeReason.PET_FREE
				});
			}
			LogsDatabase.logPetFree(pPet).then();
			await pPet.destroy();
			entity.Player.petId = null;
			entity.Player.lastPetFree = new Date();
			await entity.Player.save();
			const freedEmbed = new DraftBotEmbed()
				.formatAuthor(petFreeModule.get("successTitle"), interaction.user)
				.setDescription(petFreeModule.format("petFreed", {
					pet: `${pPet.getPetEmote()} ${pPet.nickname ? pPet.nickname : pPet.getPetTypeName(petFreeModule.language)}`
				}));

			if (pPet.isFeisty()) {
				freedEmbed.setDescription(`${freedEmbed.data.description}\n\n${petFreeModule.get("wasFeisty")}`);
			}

			let guild: Guild;
			try {
				guild = await Guilds.getById(entity.Player.guildId);
			}
			catch (error) {
				guild = null;
			}

			if (guild !== null && luckyMeat(guild, pPet)) {
				guild.carnivorousFood += PetFreeConstants.MEAT_GIVEN;
				await guild.save();
				freedEmbed.setDescription(`${freedEmbed.data.description}\n\n${petFreeModule.get("giveMeat")}`);
			}

			await interaction.followUp({embeds: [freedEmbed]});
			return;
		}
		await sendErrorMessage(interaction.user, interaction, petFreeModule.language, petFreeModule.get("canceled"), true);
	};
}

/**
 * Says if the pet can be freed or not
 * @param pPet
 * @param interaction
 * @param petFreeModule
 * @param entity
 */
async function cantBeFreed(pPet: PetEntity, interaction: CommandInteraction, petFreeModule: TranslationModule, entity: Entity): Promise<boolean> {
	if (!pPet) {
		await replyErrorMessage(
			interaction,
			petFreeModule.language,
			Translations.getModule("commands.pet", petFreeModule.language).get("noPet")
		);
		return true;
	}

	const cooldownTime = PetFreeConstants.FREE_COOLDOWN - (new Date().valueOf() - entity.Player.lastPetFree.valueOf());
	if (cooldownTime > 0) {
		await replyErrorMessage(
			interaction,
			petFreeModule.language,
			petFreeModule.format("cooldown", {
				time: minutesDisplay(millisecondsToMinutes(cooldownTime))
			})
		);
		return true;
	}

	if (pPet.isFeisty() && entity.Player.money < PetFreeConstants.FREE_FEISTY_COST) {
		await replyErrorMessage(
			interaction,
			petFreeModule.language,
			petFreeModule.format("noMoney", {
				money: PetFreeConstants.FREE_FEISTY_COST - entity.Player.money
			})
		);
		return true;
	}
	return false;
}

/**
 * Allow to free a pet
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const petFreeModule = Translations.getModule("commands.petFree", language);

	const pPet = entity.Player.Pet;
	if (await cantBeFreed(pPet, interaction, petFreeModule, entity)) {
		return;
	}

	const confirmEmbed = new DraftBotValidateReactionMessage(interaction.user, getPetFreeEndCallback(entity, pPet, petFreeModule, interaction))
		.formatAuthor(petFreeModule.get("successTitle"), interaction.user)
		.setDescription(petFreeModule.format("confirmDesc", {
			pet: `${pPet.getPetEmote()} ${pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language)}`
		}));

	if (pPet.isFeisty()) {
		confirmEmbed.setFooter({text: petFreeModule.get("isFeisty")});
	}

	await confirmEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.PET_FREE, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.petFree", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.petFree", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};