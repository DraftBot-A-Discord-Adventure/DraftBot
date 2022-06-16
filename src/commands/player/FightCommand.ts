import {Entities, Entity} from "../../core/models/Entity";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {FightConstants} from "../../core/constants/FightConstants";
import {Replacements} from "../../core/utils/StringFormatter";
import {Fighter} from "../../core/fights/Fighter";
import {DraftBotBroadcastValidationMessage} from "../../core/messages/DraftBotBroadcastValidationMessage";
import {minutesToMilliseconds} from "../../core/utils/TimeUtils";
import {FightController} from "../../core/fights/FightController";
import {Classes} from "../../core/models/Class";

/**
 * Check if an entity is allowed to fight
 * @param entity
 * @param {boolean} friendly
 * @return error
 */
async function canFight(entity: Entity, friendly: boolean): Promise<string> {
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

/**
 * send the error message to the user
 * @param interaction - the interaction
 * @param fightTranslationModule - the translation module
 * @param error - the error message
 * @param entity - the entity that is checked
 * @param isAboutSelectedOpponent - true if the error is about the selected opponent
 * @param replyingError - true if the error is a replying error
 */
function sendError(interaction: CommandInteraction, fightTranslationModule: TranslationModule, error: string, entity: Entity, isAboutSelectedOpponent: boolean, replyingError: boolean) {
	const replacements: Replacements = error === FightConstants.FIGHT_ERROR.WRONG_LEVEL ? {
		level: FightConstants.REQUIRED_LEVEL
	} : {
		pseudo: entity.getMention()
	};
	const errorTranslationName = isAboutSelectedOpponent ? error + ".indirect" : error + ".direct";
	sendErrorMessage(
		interaction.user,
		interaction.channel,
		fightTranslationModule.language,
		fightTranslationModule.format(errorTranslationName, replacements),
		false,
		replyingError ? interaction : null);
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

/**
 * analyze the result of the fight broadcast collector
 * @param interaction
 * @param fightTranslationModule
 * @param friendly
 * @param askedEntity
 * @param askingFighter
 * @return boolean - false if the broadcast has to continue and true if the broadcast is finished
 */
function getAcceptCallback(interaction: CommandInteraction, fightTranslationModule: TranslationModule, friendly: boolean, askedEntity: Entity | null, askingFighter: Fighter) {
	return async function(user: User) {
		const incomingFighterEntity = await Entities.getByDiscordUserId(user.id);
		const attackerFightErrorStatus = await canFight(incomingFighterEntity, friendly);
		if (askedEntity !== null && incomingFighterEntity.discordUserId !== askedEntity.discordUserId) {
			return false;
		}
		if (attackerFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
			sendError(interaction, fightTranslationModule, attackerFightErrorStatus, incomingFighterEntity, true, false);
			return false;
		}
		const incomingFighter = new Fighter(incomingFighterEntity,await Classes.getById(incomingFighterEntity.Player.class));
		await incomingFighter.loadStats(friendly);
		const fightController = new FightController(askingFighter, incomingFighter, friendly, interaction.channel, fightTranslationModule.language);
		await fightController.startFight();
		return true;
	};
}

/**
 * load the customs error messages for the broadcast collector
 * @param fightTranslationModule - the translation module
 * @param respondingEntity - the entity that is responding to the fight
 */
function getBroadcastErrorStrings(fightTranslationModule: TranslationModule, respondingEntity: Entity) {
	return {
		errorBroadcastCancelled: fightTranslationModule.get("error.canceled"),
		errorSelfAccept: fightTranslationModule.get("error.fightHimself"),
		errorSelfAcceptSpam: fightTranslationModule.get("error.spamCanceled"),
		errorOtherDeny: fightTranslationModule.get("error.onlyInitiator"),
		errorNoAnswer: fightTranslationModule.get(`error.${respondingEntity ? "opponentNotAvailable" : "noOneAvailable"}`)
	};
}

/** ï
 * Start a new fight
 * @param interaction
 * @param language - Language to use in the response
 * @param entity
 * @param friendly true if the fight is friendly
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity, friendly = false): Promise<void> {

	const askingFighter = new Fighter(entity,await Classes.getById(entity.Player.class));
	const askedEntity: Entity | null = await Entities.getByOptions(interaction);
	const askedFighter: Fighter | null = new Fighter(askedEntity, await Classes.getById(askedEntity.Player.class));
	const fightTranslationModule: TranslationModule = Translations.getModule("commands.fight", language);
	if (askedEntity && entity.discordUserId === askedEntity.discordUserId) {
		// the user is trying to fight himself
		sendErrorMessage(interaction.user, interaction.channel, language, fightTranslationModule.get("error.fightHimself"), false, interaction);
		return;
	}
	const attackerFightErrorStatus = await canFight(entity, friendly);
	if (attackerFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
		sendError(interaction, fightTranslationModule, attackerFightErrorStatus, entity, false, true);
		return;
	}
	if (askedEntity) {
		const defenderFightErrorStatus = await canFight(askedEntity, friendly);
		if (defenderFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
			sendError(interaction, fightTranslationModule, defenderFightErrorStatus, entity, true, true);
			return;
		}
	}
	const fightAskingDescription = await getFightDescription(askingFighter, friendly, askedEntity, fightTranslationModule, askedFighter);
	await new DraftBotBroadcastValidationMessage(
		interaction, language,
		getAcceptCallback(interaction, fightTranslationModule, friendly, askedEntity, askingFighter),
		"fight",
		getBroadcastErrorStrings(fightTranslationModule, askedEntity),
		minutesToMilliseconds(FightConstants.ASKING_MENU_DURATION))
		.formatAuthor(fightTranslationModule.get("fightAskingTitle"), interaction.user)
		.setDescription(fightAskingDescription)
		.reply();
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