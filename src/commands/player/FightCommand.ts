import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {CommandInteraction, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {FightConstants} from "../../core/constants/FightConstants";
import {format, Replacements} from "../../core/utils/StringFormatter";
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
import {EloGameResult, EloUtils} from "../../core/utils/EloUtils";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Leagues} from "../../core/database/game/models/League";

/**
 * Check if a player is blocked
 * @param player
 */
async function isBlocked(player: Player) : Promise<boolean> {
	return (await BlockingUtils.getPlayerBlockingReason(player.discordUserId)).length !== 0;
}

/**
 * Check if the player has enough fight points to fight
 * @param player
 * @param friendly
 */
async function noFightPointsAvailable(player: Player, friendly: boolean): Promise<boolean> {
	return await player.getCumulativeFightPoint() === 0 && !friendly;
}

/**
 * Check if a player has an effect that disallow him to fight
 * @param player
 * @param date
 * @param friendly
 */
function hasEffect(player: Player, date: Date, friendly: boolean): boolean {
	return !player.currentEffectFinished(date) && !friendly;
}

/**
 * Check if a player is allowed to fight
 * @param player
 * @param opponent Can be null if none yet
 * @param {boolean} friendly
 * @param date
 * @return error
 */
async function canFight(player: Player, opponent: Player, friendly: boolean, date: Date): Promise<string> {
	if (player === null) {
		return FightConstants.FIGHT_ERROR.BABY;
	}

	if (player.level < FightConstants.REQUIRED_LEVEL) {
		return FightConstants.FIGHT_ERROR.WRONG_LEVEL;
	}

	if (player.isDead()) {
		return FightConstants.FIGHT_ERROR.DEAD;
	}

	if (hasEffect(player, date, friendly)) {
		return FightConstants.FIGHT_ERROR.DISALLOWED_EFFECT;
	}

	if (await noFightPointsAvailable(player, friendly)) {
		return FightConstants.FIGHT_ERROR.NO_FIGHT_POINTS;
	}

	if (await isBlocked(player)) {
		return FightConstants.FIGHT_ERROR.OCCUPIED;
	}

	if (opponent && !friendly && Math.abs(player.gloryPoints - opponent.gloryPoints) > FightConstants.ELO.MAX_ELO_GAP) {
		return FightConstants.FIGHT_ERROR.ELO_GAP;
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
			fightTranslationModule.format(errorTranslationName, replacements),
			false,
			false
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

async function fightEndCallback(fight: FightController): Promise<void> {
	// Player variables
	const player1 = await Players.getById((fight.fighters[0] as PlayerFighter).player.id);
	const player2 = await Players.getById((fight.fighters[1] as PlayerFighter).player.id);
	const player1GameResult = fight.isADraw() ? EloGameResult.DRAW : fight.getWinner() === 0 ? EloGameResult.WIN : EloGameResult.LOSE;
	const player2GameResult = player1GameResult === EloGameResult.DRAW ? EloGameResult.DRAW : player1GameResult === EloGameResult.WIN ? EloGameResult.LOSE : EloGameResult.WIN;

	// Calculate elo
	const player1KFactor = EloUtils.getKFactor(player1);
	const player2KFactor = EloUtils.getKFactor(player2);
	const player1NewRating = EloUtils.calculateNewRating(player1.gloryPoints, player2.gloryPoints, player1GameResult, player1KFactor);
	const player2NewRating = EloUtils.calculateNewRating(player2.gloryPoints, player1.gloryPoints, player2GameResult, player2KFactor);

	// Compute leagues
	const player1OldLeague = await Leagues.getByGlory(player1.gloryPoints);
	const player2OldLeague = await Leagues.getByGlory(player2.gloryPoints);
	const player1NewLeague = await Leagues.getByGlory(player1NewRating);
	const player2NewLeague = await Leagues.getByGlory(player2NewRating);

	// Translation module
	const fightTr = Translations.getModule("commands.fight", fight.getFightView().language);

	// Create embed fields
	const gloryField = fightTr.format("elo.glory", {
		player: player1.getMention(),
		ratingDiff: player1NewRating - player1.gloryPoints
	}) + fightTr.format("elo.glory", {
		player: player2.getMention(),
		ratingDiff: player2NewRating - player2.gloryPoints
	}) + "\n";
	let leagueChange = "";
	if (player1OldLeague.id !== player1NewLeague.id) {
		leagueChange += fightTr.format(player1OldLeague.maxGloryPoints < player1NewLeague.maxGloryPoints ? "elo.leagueChangeUp" : "elo.leagueChangeDown", {
			player: player1.getMention(),
			oldLeague: player1OldLeague.toString(fightTr.language),
			newLeague: player1NewLeague.toString(fightTr.language)
		});
	}
	if (player2OldLeague.id !== player2NewLeague.id) {
		leagueChange += fightTr.format(player2OldLeague.maxGloryPoints < player2NewLeague.maxGloryPoints ? "elo.leagueChangeUp" : "elo.leagueChangeDown", {
			player: player2.getMention(),
			oldLeague: player2OldLeague.toString(fightTr.language),
			newLeague: player2NewLeague.toString(fightTr.language)
		});
	}

	// Create embed
	const embed = new DraftBotEmbed()
		.setTitle(fightTr.get("elo.title"))
		.addFields({
			name: fightTr.get("elo.gloryField"),
			value: gloryField,
			inline: false
		});
	if (leagueChange !== "") {
		embed.addFields({
			name: fightTr.get("elo.leagueField"),
			value: leagueChange,
			inline: false
		});
	}

	// Description
	if (Math.abs(player1.gloryPoints - player2.gloryPoints) < (player1KFactor + player2KFactor) / 2) {
		embed.setDescription(format(fightTr.getRandom("elo.sameElo"), {
			player1: player1.getMention(),
			player2: player2.getMention()
		}));
	}
	else if (player1GameResult === EloGameResult.WIN && player1.gloryPoints > player2.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.higherEloWins"), {
			winner: player1.getMention(),
			loser: player2.getMention()
		}));
	}
	else if (player2GameResult === EloGameResult.WIN && player2.gloryPoints > player1.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.higherEloWins"), {
			winner: player2.getMention(),
			loser: player1.getMention()
		}));
	}
	else if (player1GameResult === EloGameResult.WIN && player1.gloryPoints < player2.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.lowestEloWins"), {
			winner: player1.getMention(),
			loser: player2.getMention()
		}));
	}
	else if (player2GameResult === EloGameResult.WIN && player2.gloryPoints < player1.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.lowestEloWins"), {
			winner: player2.getMention(),
			loser: player1.getMention()
		}));
	}
	else {
		embed.setDescription(format(fightTr.getRandom("elo.draw"), {
			player1: player1.getMention(),
			player2: player2.getMention()
		}));
	}

	// Change glory and save
	player1.gloryPoints = player1NewRating;
	player2.gloryPoints = player2NewRating;
	await Promise.all([
		player1.save(),
		player2.save()
	]);

	fight.getFightView().channel.send({
		embeds: [
			embed
		]
	});
}

/**
 * analyze the result of the fight broadcast collector
 * @param interaction
 * @param fightTranslationModule
 * @param friendly
 * @param initiatorPlayer
 * @param askedPlayer
 * @param askingFighter
 * @return boolean - false if the broadcast has to continue and true if the broadcast is finished
 */
function getAcceptCallback(
	interaction: CommandInteraction,
	fightTranslationModule: TranslationModule,
	friendly: boolean,
	initiatorPlayer: Player,
	askedPlayer: Player | null,
	askingFighter: Fighter
): (user: User) => Promise<boolean> {
	return async function(user: User): Promise<boolean> {
		const incomingFighterPlayer = await Players.getByDiscordUserId(user.id);
		const attackerFightErrorStatus = await canFight(incomingFighterPlayer, initiatorPlayer, friendly, new Date());
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
		if (!friendly) {
			fightController.setEndCallback(fightEndCallback);
		}
		fightController.startFight().then();
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
	const attackerFightErrorStatus = await canFight(player, askedEntity, friendly, new Date());
	if (attackerFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
		await sendError(interaction, fightTranslationModule, attackerFightErrorStatus, false, true);
		return;
	}
	let askedFighter: PlayerFighter | null;
	if (askedEntity) {
		const defenderFightErrorStatus = await canFight(askedEntity, player, friendly, new Date());
		if (defenderFightErrorStatus !== FightConstants.FIGHT_ERROR.NONE) {
			await sendError(interaction, fightTranslationModule, defenderFightErrorStatus, true, true);
			return;
		}
		askedFighter = new PlayerFighter(interaction.options.getUser("user"), askedEntity, await Classes.getById(askedEntity.class));
	}
	const fightAskingDescription = await getFightDescription(askingFighter, friendly, askedEntity, fightTranslationModule, askedFighter);
	await new DraftBotBroadcastValidationMessage(
		interaction, language,
		getAcceptCallback(interaction, fightTranslationModule, friendly, player, askedEntity, askingFighter),
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