import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {CommandInteraction, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {FightConstants} from "../../core/constants/FightConstants";
import {Replacements} from "../../core/utils/StringFormatter";
import {Fighter} from "../../core/fights/fighter/Fighter";
import {
	BroadcastTranslationModuleLike,
	DraftBotBroadcastValidationMessage
} from "../../core/messages/DraftBotBroadcastValidationMessage";
import {FightController} from "../../core/fights/FightController";
import {Classes} from "../../core/database/game/models/Class";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import {PlayerFighter} from "../../core/fights/fighter/PlayerFighter";

/**
 * Check if a player is allowed to fight
 * @param player
 * @param {boolean} friendly
 * @param date
 * @return error
 */
async function canFight(player: Player, friendly: boolean, date: Date): Promise<string> {
	if (player === null) {
		return null;
	}
	if (player.level < FightConstants.REQUIRED_LEVEL) {
		return FightConstants.FIGHT_ERROR.WRONG_LEVEL;
	}
	if (!player.currentEffectFinished(date) && !friendly) {
		return FightConstants.FIGHT_ERROR.DISALLOWED_EFFECT;
	}
	if ((await BlockingUtils.getPlayerBlockingReason(player.discordUserId)).length !== 0) {
		return FightConstants.FIGHT_ERROR.OCCUPIED;
	}
	if (await player.getCumulativeFightPoint() === 0 && !friendly) {
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
 * @param isAboutSelectedOpponent - true if the error is about the selected opponent
 * @param replyingError - true if the error is a replying error
 * @param user
 */
async function sendError(
	interaction: CommandInteraction,
	fightTranslationModule: TranslationModule,
	error: string,
	isAboutSelectedOpponent: boolean,
	replyingError: boolean,
	user = interaction.user
): Promise<void> {
	const replacements: Replacements = error === FightConstants.FIGHT_ERROR.WRONG_LEVEL ? {
		level: FightConstants.REQUIRED_LEVEL
	} : {
		pseudo: (await Players.getOrRegister(user.id))[0].getMention()
	};
	const errorTranslationName = isAboutSelectedOpponent ? error + ".indirect" : error + ".direct";
	replyingError ?
		await replyErrorMessage(
			interaction,
			fightTranslationModule.language,
			fightTranslationModule.format(errorTranslationName, replacements)
		)
		: await sendErrorMessage(
			user,
			interaction,
			fightTranslationModule.language,
			fightTranslationModule.format(errorTranslationName, replacements)
		);
}

/**
 * get the string that display the information about the fight for the menu
 * @param askingFighter
 * @param friendly
 * @param respondingPlayer
 * @param fightTranslationModule
 * @param respondingFighter
 */
async function getFightDescription(
	askingFighter: PlayerFighter,
	friendly: boolean,
	respondingPlayer: Player | null,
	fightTranslationModule: TranslationModule,
	respondingFighter: PlayerFighter | null
): Promise<string> {
	let fightAskingDescription;
	const promises: Promise<void>[] = [askingFighter.loadStats(friendly)];
	if (!respondingPlayer) {
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
	fightAskingDescription += `\n\n${askingFighter.getStringDisplay(fightTranslationModule)}`;
	if (respondingPlayer) {
		fightAskingDescription += `\n${respondingFighter.getStringDisplay(fightTranslationModule)}`;
	}
	return fightAskingDescription;
}

/**
 * analyze the result of the fight broadcast collector
 * @param interaction
 * @param fightTranslationModule
 * @param friendly
 * @param askedPlayer
 * @param askingFighter
 * @return boolean - false if the broadcast has to continue and true if the broadcast is finished
 */
function getAcceptCallback(
	interaction: CommandInteraction,
	fightTranslationModule: TranslationModule,
	friendly: boolean,
	askedPlayer: Player | null,
	askingFighter: Fighter
): (user: User) => Promise<boolean> {
	return async function(user: User): Promise<boolean> {
		const incomingFighterPlayer = await Players.getByDiscordUserId(user.id);
		const attackerFightErrorStatus = await canFight(incomingFighterPlayer, true, interaction.createdAt);
		if (askedPlayer !== null && incomingFighterPlayer.discordUserId !== askedPlayer.discordUserId) {
			return false;
		}
		if (attackerFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
			await sendError(interaction, fightTranslationModule, attackerFightErrorStatus, false, false, user);
			return false;
		}
		const incomingFighter = new PlayerFighter(user, incomingFighterPlayer, await Classes.getById(incomingFighterPlayer.class));
		await incomingFighter.loadStats(friendly);
		const fightController = new FightController(askingFighter, incomingFighter, friendly, interaction.channel, fightTranslationModule.language);
		fightController.startFight().finally(() => null);
		return true;
	};
}

/**
 * load the customs error messages for the broadcast collector
 * @param fightTranslationModule - the translation module
 * @param respondingPlayer - the player that is responding to the fight
 */
function getBroadcastErrorStrings(fightTranslationModule: TranslationModule, respondingPlayer: Player): BroadcastTranslationModuleLike {
	return {
		errorBroadcastCancelled: fightTranslationModule.get("error.canceled"),
		errorSelfAccept: fightTranslationModule.get("error.fightHimself"),
		errorSelfAcceptSpam: fightTranslationModule.get("error.spamCanceled"),
		errorOtherDeny: fightTranslationModule.get("error.onlyInitiator"),
		errorNoAnswer: fightTranslationModule.get(`error.${respondingPlayer ? "opponentNotAvailable" : "noOneAvailable"}`)
	};
}

/**
 * Start a new fight
 * @param interaction
 * @param language - Language to use in the response
 * @param player
 * @param friendly true if the fight is friendly
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player, friendly = false): Promise<void> {
	const askingFighter = new PlayerFighter(interaction.user, player, await Classes.getById(player.class));
	const askedEntity: Player | null = await Players.getByOptions(interaction);
	const fightTranslationModule: TranslationModule = Translations.getModule("commands.fight", language);
	if (askedEntity && player.discordUserId === askedEntity.discordUserId) {
		// the user is trying to fight himself
		await replyErrorMessage(interaction, language, fightTranslationModule.get("error.fightHimself"));
		return;
	}
	const attackerFightErrorStatus = await canFight(player, true, interaction.createdAt);
	if (attackerFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
		await sendError(interaction, fightTranslationModule, attackerFightErrorStatus, false, true);
		return;
	}
	let askedFighter: PlayerFighter | null;
	if (askedEntity) {
		const defenderFightErrorStatus = await canFight(askedEntity, true, interaction.createdAt);
		if (defenderFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
			await sendError(interaction, fightTranslationModule, defenderFightErrorStatus, true, true);
			return;
		}
		askedFighter = new PlayerFighter(interaction.options.getUser("user"), askedEntity, await Classes.getById(askedEntity.class));
	}
	const fightAskingDescription = await getFightDescription(askingFighter, friendly, askedEntity, fightTranslationModule, askedFighter);
	await new DraftBotBroadcastValidationMessage(
		interaction, language,
		getAcceptCallback(interaction, fightTranslationModule, friendly, askedEntity, askingFighter),
		BlockingConstants.REASONS.FIGHT,
		getBroadcastErrorStrings(fightTranslationModule, askedEntity),
		FightConstants.ASKING_MENU_DURATION)
		.formatAuthor(fightTranslationModule.get("fightAskingTitle"), interaction.user)
		.setDescription(fightAskingDescription)
		.reply();
}

const currentCommandFrenchTranslations = Translations.getModule("commands.fight", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.fight", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		requiredLevel: FightConstants.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};