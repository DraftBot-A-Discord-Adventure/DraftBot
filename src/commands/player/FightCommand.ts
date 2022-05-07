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
	sendErrorMessage(interaction.user, interaction.channel, fightTranslationModule.language, fightTranslationModule.format(errorTranslationName, replacements), true, interaction);
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
	const respondingEntity = await Entities.getByOptions(interaction);
	const respondingFighter: Fighter = new Fighter(respondingEntity);
	const fightTranslationModule: TranslationModule = Translations.getModule("commands.fight", language);
	if (respondingEntity && entity.discordUserId === respondingEntity.discordUserId) {
		// the user is trying to fight himself
		sendErrorMessage(interaction.user, interaction.channel, language, fightTranslationModule.get("error.fightHimself"), true, interaction);
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
	let msg;
	const spamCount = 0;
	const spammers = [];
	BlockingUtils.blockPlayer(entity.discordUserId, "fight");
	const promises: Promise<void>[] = [askingFighter.loadStats(friendly)];
	if (!respondingEntity) {
		msg = fightTranslationModule.format("wantsToFightAnyone", {
			friendly: friendly ? fightTranslationModule.get("friendly") : "",
			player: askingFighter.getMention()
		});
	}
	else {
		msg = fightTranslationModule.format("wantsToFightSomeone", {
			friendly: friendly ? fightTranslationModule.get("friendly") : "",
			player: askingFighter.getMention(),
			opponent: respondingFighter.getMention()
		});
		promises.push(respondingFighter.loadStats(friendly));
	}
	await Promise.all(promises);
	msg += "\n\n" + await askingFighter.getStringDisplay(fightTranslationModule);
	if (respondingEntity) {
		msg += "\n" + await respondingFighter.getStringDisplay(fightTranslationModule);
	}
	interaction.reply(msg);
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