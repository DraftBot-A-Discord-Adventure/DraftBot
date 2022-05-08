import {Entities, Entity} from "../../core/models/Entity";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {FightConstants} from "../../core/constants/FightConstants";
import {Replacements} from "../../core/utils/StringFormatter";
import {Fighter} from "../../core/fights/Fighter";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotReactionMessage} from "../../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../../core/messages/DraftBotReaction";

/**
 * Check if an entity is allowed to fight
 * @param entity
 * @param {boolean} friendly
 * @return error
 */
async function canFight(entity: Entity, friendly: boolean) {
	if (entity === null) {
		return null;
	}
	if (entity.Player.level < FightConstants.REQUIRED_LEVEL) {
		return FightConstants.FIGHT_ERROR.WRONG_LEVEL;
	}
	if (!entity.Player.currentEffectFinished() && !friendly) {
		return FightConstants.FIGHT_ERROR.DISALLOWED_EFFECT;
	}
	if (await BlockingUtils.getPlayerBlockingReason(entity.discordUserId) !== null) {
		return FightConstants.FIGHT_ERROR.OCCUPIED;
	}
	if (await entity.getCumulativeHealth() === 0 && !friendly) {
		return FightConstants.FIGHT_ERROR.NO_FIGHT_POINTS;
	}
	// the player is able to fight
	return FightConstants.FIGHT_ERROR.NONE;
}

function sendError(interaction: CommandInteraction, fightTranslationModule: TranslationModule, error: string, entity: Entity, isAboutSelectedOpponent: boolean) {
	const replacements: Replacements = error === FightConstants.FIGHT_ERROR.WRONG_LEVEL ? {
		level: FightConstants.REQUIRED_LEVEL
	} : {
		pseudo: entity.getMention()
	};
	const errorTranslationName = isAboutSelectedOpponent ? error + ".indirect" : error + ".direct";
	sendErrorMessage(interaction.user, interaction.channel, fightTranslationModule.language, fightTranslationModule.format(errorTranslationName, replacements), false, interaction);
}

function refuseCallback() {
	console.log("cancel");
}

function validateCallback() {
	console.log("validate");
}

function endCallbackFight(askingEntity: Entity, respondingEntity: Entity | null, interaction: CommandInteraction, fightTranslationModule: TranslationModule, executeCommand1: executeCommand) {

	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(askingEntity.discordUserId);

		if (true) {
			// the collector ended due to spam, do nothing
			return;
		}
		if (respondingEntity) {
			await sendErrorMessage(interaction.user, interaction.channel, fightTranslationModule.language, fightTranslationModule.get("error.noOneAvailable"), false);
		}
		else {
			await sendErrorMessage(interaction.user, interaction.channel, fightTranslationModule.language, fightTranslationModule.get("error.opponentNotAvailable"), false);
		}
		refuseCallback();
	};
}


/**
 * get the string that display the information about the fight for the menu
 * @param askingFighter
 * @param friendly
 * @param respondingEntity
 * @param fightTranslationModule
 * @param respondingFighter
 */
async function getFightDescription(askingFighter: Fighter, friendly: boolean, respondingEntity: Entity | null, fightTranslationModule: TranslationModule, respondingFighter: Fighter | null) {
	let fightAskingDescription;
	const promises: Promise<void>[] = [askingFighter.loadStats(friendly)];
	if (!respondingEntity) {
		fightAskingDescription = fightTranslationModule.format("wantsToFightAnyone", {
			friendly: friendly ? fightTranslationModule.get("friendly") : "",
			player: askingFighter.getMention()
		});
	}
	else {
		fightAskingDescription = fightTranslationModule.format("wantsToFightSomeone", {
			friendly: friendly ? fightTranslationModule.get("friendly") : "",
			player: askingFighter.getMention(),
			opponent: respondingFighter.getMention()
		});
		promises.push(respondingFighter.loadStats(friendly));
	}
	await Promise.all(promises);
	fightAskingDescription += "\n\n" + await askingFighter.getStringDisplay(fightTranslationModule);
	if (respondingEntity) {
		fightAskingDescription += "\n" + await respondingFighter.getStringDisplay(fightTranslationModule);
	}
	return fightAskingDescription;
}

/** ï
 * Start a new fight
 * @param interaction
 * @param language - Language to use in the response
 * @param entity
 * @param friendly true if the fight is friendly
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity, friendly = false): Promise<void> {

	const askingFighter = new Fighter(entity);
	const respondingEntity: Entity | null = await Entities.getByOptions(interaction);
	const respondingFighter: Fighter | null = new Fighter(respondingEntity);
	const fightTranslationModule: TranslationModule = Translations.getModule("commands.fight", language);
	if (respondingEntity && entity.discordUserId === respondingEntity.discordUserId) {
		// the user is trying to fight himself
		sendErrorMessage(interaction.user, interaction.channel, language, fightTranslationModule.get("error.fightHimself"), false, interaction);
		return;
	}
	const attackerFightErrorStatus = await canFight(entity, friendly);
	if (attackerFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
		sendError(interaction, fightTranslationModule, attackerFightErrorStatus, entity, false);
		return;
	}
	if (respondingEntity) {
		const defenderFightErrorStatus = await canFight(respondingEntity, friendly);
		if (defenderFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
			sendError(interaction, fightTranslationModule, defenderFightErrorStatus, entity, true);
			return;
		}
	}
	BlockingUtils.blockPlayer(entity.discordUserId, "fight");
	const fightAskingDescription = await getFightDescription(askingFighter, friendly, respondingEntity, fightTranslationModule, respondingFighter);

	const endCallback = endCallbackFight(
		entity, respondingEntity, interaction, fightTranslationModule, this
	);

	const validationEmbed = new DraftBotReactionMessage([
		new DraftBotReaction(Constants.REACTIONS.VALIDATE_REACTION, validateCallback),
		new DraftBotReaction(Constants.REACTIONS.REFUSE_REACTION, refuseCallback)
	], null, endCallback, FightConstants.SPAM_PROTECTION_MAX_REACTION_AMOUNT, true, FightConstants.ASKING_MENU_DURATION)
		.formatAuthor(fightTranslationModule.get("fightAskingTitle"), interaction.user)
		.setDescription(fightAskingDescription) as DraftBotValidateReactionMessage;
	await validationEmbed.reply(interaction);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("fight")
		.setDescription("Start a new fight")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to fight with")
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		requiredLevel: FightConstants.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};