import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {User} from "discord.js";
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
import {League, Leagues} from "../../core/database/game/models/League";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {draftBotInstance} from "../../core/bot";
import {FightOvertimeBehavior} from "../../core/fights/FightOvertimeBehavior";
import {MapCache} from "../../core/maps/MapCache";
import {DraftbotInteraction} from "../../core/messages/DraftbotInteraction";

type PlayerInformation = {
	player: Player,
	playerNewRating: number,
	playerKFactor: number,
	playerGameResult: EloGameResult
};

/**
 * Check if a player is blocked
 * @param player
 */
async function isBlocked(player: Player): Promise<boolean> {
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

	if (MapCache.allPveMapLinks.includes(player.mapLinkId)) {
		return FightConstants.FIGHT_ERROR.PVE_ISLAND;
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

	if (opponent && !friendly) {
		if (Math.abs(player.gloryPoints - opponent.gloryPoints) > FightConstants.ELO.MAX_ELO_GAP) {
			return FightConstants.FIGHT_ERROR.ELO_GAP;
		}

		const bo3 = await LogsReadRequests.getRankedFightsThisWeek(player.discordUserId, opponent.discordUserId);
		if (bo3.won > 1 || bo3.lost > 1 || bo3.draw + bo3.won + bo3.lost >= 3) {
			return FightConstants.FIGHT_ERROR.BEST_OF_3;
		}
	}

	// The player is able to fight
	return FightConstants.FIGHT_ERROR.NONE;
}

/**
 * Send the error message to the user
 * @param interaction - the interaction
 * @param fightTranslationModule - the translation module
 * @param error - the error message
 * @param isAboutSelectedOpponent - true if the error is about the selected opponent
 * @param replyingError - true if the error is a replying error
 * @param user
 */
async function sendError(
	interaction: DraftbotInteraction,
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
	const errorTranslationName = `${error}.${isAboutSelectedOpponent ? "in" : ""}direct`;
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
 * Get the string that display the information about the fight for the menu
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
		fightAskingDescription += `\n\n${respondingFighter.getStringDisplay(fightTranslationModule)}`;
	}
	return fightAskingDescription;
}

/**
 * Code that will be executed when a fight ends (except if the fight has a bug)
 * @param fight
 */
async function fightEndCallback(fight: FightController): Promise<void> {
	const fightLogId = await draftBotInstance.logsDatabase.logFight(fight);

	if (!fight.friendly) {
		const player1GameResult = fight.isADraw() ? EloGameResult.DRAW : fight.getWinner() === 0 ? EloGameResult.WIN : EloGameResult.LOSE;
		const player2GameResult = player1GameResult === EloGameResult.DRAW ? EloGameResult.DRAW : player1GameResult === EloGameResult.WIN ? EloGameResult.LOSE : EloGameResult.WIN;

		// Player variables
		const player1 = await Players.getById((fight.fighters[0] as PlayerFighter).player.id);
		const player2 = await Players.getById((fight.fighters[1] as PlayerFighter).player.id);

		// Calculate elo
		const player1KFactor = EloUtils.getKFactor(player1);
		const player2KFactor = EloUtils.getKFactor(player2);
		const player1NewRating = EloUtils.calculateNewRating(player1.gloryPoints, player2.gloryPoints, player1GameResult, player1KFactor);
		const player2NewRating = EloUtils.calculateNewRating(player2.gloryPoints, player1.gloryPoints, player2GameResult, player2KFactor);

		// Create embed
		const embed = await createFightEndCallbackEmbed(fight,
			{
				player: player1,
				playerNewRating: player1NewRating,
				playerKFactor: player1KFactor,
				playerGameResult: player1GameResult
			},
			{
				player: player2,
				playerNewRating: player2NewRating,
				playerKFactor: player2KFactor,
				playerGameResult: player2GameResult
			});

		// Change glory and fightCountdown and save
		await player1.setGloryPoints(player1NewRating, NumberChangeReason.FIGHT, fight.getFightView().channel, fight.getFightView().language, fightLogId);
		player1.fightCountdown--;
		if (player1.fightCountdown < 0) {
			player1.fightCountdown = 0;
		}
		await player2.setGloryPoints(player2NewRating, NumberChangeReason.FIGHT, fight.getFightView().channel, fight.getFightView().language, fightLogId);
		player2.fightCountdown--;
		if (player2.fightCountdown < 0) {
			player2.fightCountdown = 0;
		}
		await Promise.all([
			player1.save(),
			player2.save()
		]);

		await fight.getFightView().channel.send({
			embeds: [
				embed
			]
		});
	}
}

/**
 * Create the description of the glory field
 * @param ratingDiff1
 * @param fightTr
 * @param player1
 * @param ratingDiff2
 * @param player2
 */
function generateGloryField(
	ratingDiff1: number,
	fightTr: TranslationModule,
	player1: PlayerInformation,
	ratingDiff2: number,
	player2: PlayerInformation
): string {
	let gloryField = "";
	// Create embed fields
	if (ratingDiff1 !== 0) {
		gloryField += fightTr.format("elo.glory", {
			player: player1.player.getMention(),
			ratingDiff: ratingDiff1
		});
	}
	if (ratingDiff2 !== 0) {
		gloryField += fightTr.format("elo.glory", {
			player: player2.player.getMention(),
			ratingDiff: ratingDiff2
		});
	}
	return gloryField;
}

type PlayerLeagueInfo = {
	player: Player,
	playerOldLeague: League,
	playerNewLeague: League
}

/**
 * Generate the description of the field that display the league change if there is one
 * @param player1LeagueInfo
 * @param player2LeagueInfo
 * @param fightTr
 */
function generateLeagueChangeField(
	player1LeagueInfo: PlayerLeagueInfo,
	player2LeagueInfo: PlayerLeagueInfo,
	fightTr: TranslationModule)
	: string {
	let leagueChange = "";
	if (player1LeagueInfo.playerOldLeague.id !== player1LeagueInfo.playerNewLeague.id) {
		leagueChange += fightTr.format(player1LeagueInfo.playerOldLeague.maxGloryPoints < player1LeagueInfo.playerNewLeague.maxGloryPoints ? "elo.leagueChangeUp" : "elo.leagueChangeDown", {
			player: player1LeagueInfo.player.getMention(),
			oldLeague: player1LeagueInfo.playerOldLeague.toString(fightTr.language),
			newLeague: player1LeagueInfo.playerNewLeague.toString(fightTr.language)
		});
	}
	if (player2LeagueInfo.playerOldLeague.id !== player2LeagueInfo.playerNewLeague.id) {
		leagueChange += fightTr.format(player2LeagueInfo.playerOldLeague.maxGloryPoints < player2LeagueInfo.playerNewLeague.maxGloryPoints ? "elo.leagueChangeUp" : "elo.leagueChangeDown", {
			player: player2LeagueInfo.player.getMention(),
			oldLeague: player2LeagueInfo.playerOldLeague.toString(fightTr.language),
			newLeague: player2LeagueInfo.playerNewLeague.toString(fightTr.language)
		});
	}
	return leagueChange;
}

/**
 * Generate the description of the embed depending on the elo of the players and the result of the fight
 * @param player1
 * @param player2
 * @param embed
 * @param fightTr
 */
function generateEmbedDescription(player1: PlayerInformation, player2: PlayerInformation, embed: DraftBotEmbed, fightTr: TranslationModule): void {
	if (Math.abs(player1.player.gloryPoints - player2.player.gloryPoints) < (player1.playerKFactor + player2.playerKFactor) / 2) {
		embed.setDescription(format(fightTr.getRandom("elo.sameElo"), {
			player1: player1.player.getMention(),
			player2: player2.player.getMention()
		}));
	}
	else if (player1.playerGameResult === EloGameResult.WIN && player1.player.gloryPoints > player2.player.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.higherEloWins"), {
			winner: player1.player.getMention(),
			loser: player2.player.getMention()
		}));
	}
	else if (player2.playerGameResult === EloGameResult.WIN && player2.player.gloryPoints > player1.player.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.higherEloWins"), {
			winner: player2.player.getMention(),
			loser: player1.player.getMention()
		}));
	}
	else if (player1.playerGameResult === EloGameResult.WIN && player1.player.gloryPoints < player2.player.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.lowestEloWins"), {
			winner: player1.player.getMention(),
			loser: player2.player.getMention()
		}));
	}
	else if (player2.playerGameResult === EloGameResult.WIN && player2.player.gloryPoints < player1.player.gloryPoints) {
		embed.setDescription(format(fightTr.getRandom("elo.lowestEloWins"), {
			winner: player2.player.getMention(),
			loser: player1.player.getMention()
		}));
	}
	else {
		embed.setDescription(format(fightTr.getRandom("elo.draw"), {
			player1: player1.player.getMention(),
			player2: player2.player.getMention()
		}));
	}
}

/**
 * Create the embed fight end callback
 * @param fight
 * @param player1
 * @param player2
 */
async function createFightEndCallbackEmbed(fight: FightController, player1: PlayerInformation, player2: PlayerInformation): Promise<DraftBotEmbed> {
	// Translation module
	const fightTr = Translations.getModule("commands.fight", fight.getFightView().language);

	// Compute leagues
	const player1OldLeague = await Leagues.getByGlory(player1.player.gloryPoints);
	const player2OldLeague = await Leagues.getByGlory(player2.player.gloryPoints);
	const player1NewLeague = await Leagues.getByGlory(player1.playerNewRating);
	const player2NewLeague = await Leagues.getByGlory(player2.playerNewRating);
	const ratingDiff1 = player1.playerNewRating - player1.player.gloryPoints;
	const ratingDiff2 = player2.playerNewRating - player2.player.gloryPoints;
	const gloryField = generateGloryField(ratingDiff1, fightTr, player1, ratingDiff2, player2);
	const leagueChange = generateLeagueChangeField(
		{
			player: player1.player,
			playerNewLeague: player1NewLeague,
			playerOldLeague: player1OldLeague
		},
		{
			player: player2.player,
			playerNewLeague: player2NewLeague,
			playerOldLeague: player2OldLeague
		}, fightTr);

	// Create embed
	const embed = new DraftBotEmbed()
		.setTitle(fightTr.get("elo.title"));
	if (ratingDiff1 !== 0 || ratingDiff2 !== 0) {
		embed.addFields({
			name: fightTr.get("elo.gloryField"),
			value: gloryField,
			inline: false
		});
	}
	if (leagueChange !== "") {
		embed.addFields({
			name: fightTr.get("elo.leagueField"),
			value: leagueChange,
			inline: false
		});
	}

	// Description
	generateEmbedDescription(player1, player2, embed, fightTr);
	return embed;
}

/**
 * Analyze the result of the fight broadcast collector
 * @param interaction
 * @param fightTranslationModule
 * @param friendly
 * @param initiatorPlayer
 * @param askedPlayer
 * @param askingFighter
 * @return boolean - false if the broadcast has to continue and true if the broadcast is finished
 */
function getAcceptCallback(
	interaction: DraftbotInteraction,
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

		const fightController = new FightController(
			{fighter1: askingFighter, fighter2: incomingFighter},
			{friendly, overtimeBehavior: FightOvertimeBehavior.END_FIGHT_DRAW},
			interaction.channel,
			fightTranslationModule.language
		);
		fightController.setEndCallback(fightEndCallback);

		fightController.startFight().then();
		return true;
	};
}

/**
 * Load the customs error messages for the broadcast collector
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
async function executeCommand(interaction: DraftbotInteraction, language: string, player: Player, friendly = false): Promise<void> {
	const askingFighter = new PlayerFighter(interaction.user, player, await Classes.getById(player.class));
	const askedEntity: Player | null = await Players.getByOptions(interaction);
	const fightTranslationModule: TranslationModule = Translations.getModule("commands.fight", language);
	const optionFriendly = interaction.options.get("friendly");
	if (optionFriendly !== null) {
		friendly = optionFriendly.value as boolean;
	}

	if (askedEntity && player.discordUserId === askedEntity.discordUserId) {
		// The user is trying to fight himself
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
		.reply(askedEntity ? askedFighter.getMention() : "");
}

const currentCommandFrenchTranslations = Translations.getModule("commands.fight", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.fight", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName(currentCommandEnglishTranslations.get("optionFriendlyName"))
				.setNameLocalizations({
					fr: currentCommandFrenchTranslations.get("optionFriendlyName")
				})
				.setDescription(currentCommandEnglishTranslations.get("optionFriendlyDescription"))
				.setDescriptionLocalizations({
					fr: currentCommandFrenchTranslations.get("optionFriendlyDescription")
				})
				.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		requiredLevel: FightConstants.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};