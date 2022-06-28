import Entity from "../models/Entity";
import {TextBasedChannel, User} from "discord.js";
import {BlockingUtils} from "../utils/BlockingUtils";
import {playerActiveObjects} from "../models/PlayerActiveObjects";
import Potion from "../models/Potion";
import {checkDrinkPotionMissions} from "../utils/ItemUtils";
import {MissionsController} from "../missions/MissionsController";
import {countNbOfPotions} from "../utils/ItemUtils";
import {TranslationModule, Translations} from "../Translations";
import {FighterStatus} from "./FighterStatus";
import {FighterAlteration} from "./FighterAlteration";
import {IFightAction} from "../attacks/IFightAction";
import Class from "../models/Class";
import {FightActionController} from "../attacks/FightActionController";
import {BlockingConstants} from "../constants/BlockingConstants";
import {FightConstants} from "../constants/FightConstants";
import {RandomUtils} from "../utils/RandomUtils";

type FighterStats = {
	fightPoints: number, maxFightPoint: number, speed: number, defense: number, attack: number, agility: number
}

const fighterStatusTranslation = ["summarize.notStarted", "summarize.attacker", "summarize.defender", "summarize.winner", "summarize.loser", "summarize.drawer", "summarize.bug"];

/**
 * @class Fighter
 */
export class Fighter {

	public stats: FighterStats;

	public nextFightActionId: string;

	public fightActionsHistory: string[];

	public availableFightActions: Map<string, IFightAction>;

	public entity: Entity

	private ready: boolean;

	private alteration: FighterAlteration;

	private status: FighterStatus;

	private readonly class: Class;

	private readonly user: User;

	public constructor(user: User, entity: Entity, playerClass: Class) {
		this.stats = {fightPoints: null, maxFightPoint: null, speed: null, defense: null, attack: null, agility: null};
		this.entity = entity;
		this.ready = false;
		this.nextFightActionId = null;
		this.fightActionsHistory = [];
		this.status = FighterStatus.NOT_STARTED;
		this.class = playerClass;
		this.availableFightActions = FightActionController.listFightActionsFromClass(this.class);
		this.user = user;
	}

	/**
	 * get the string that mention the user
	 * @public
	 */
	public getMention() {
		return this.entity.getMention();
	}

	/**
	 * set the status of the fighter
	 * @param newStatus
	 */
	setStatus(newStatus: FighterStatus) {
		this.status = newStatus;
	}

	/**
	 * the fighter loads its various stats
	 * @param friendly true if the fight is friendly
	 * @public
	 */
	public async loadStats(friendly: boolean) {
		const playerActiveObjects: playerActiveObjects = await this.entity.getPlayerActiveObjects();
		this.stats.fightPoints = friendly ? await this.entity.getMaxCumulativeFightPoint() : await this.entity.getCumulativeFightPoint();
		this.stats.maxFightPoint = await this.entity.getMaxCumulativeFightPoint();
		this.stats.attack = await this.entity.getCumulativeAttack(playerActiveObjects);
		this.stats.defense = await this.entity.getCumulativeDefense(playerActiveObjects);
		this.stats.speed = await this.entity.getCumulativeSpeed(playerActiveObjects);
		this.stats.agility = this.entity.getAgility(this.stats.defense, this.stats.speed);
	}

	/**
	 * delete the potion from the inventory of the player if needed
	 * @param friendly true if the fight is friendly
	 * @param channel
	 * @param language
	 * @public
	 */
	public async consumePotionIfNeeded(friendly: boolean, channel: TextBasedChannel, language: string) {
		if (friendly || !await this.currentPotionIsAFightPotion()) {
			return;
		}
		const drankPotion = await this.entity.Player.getMainPotionSlot().getItem() as Potion;
		await this.entity.Player.drinkPotion();
		await this.entity.save();
		await checkDrinkPotionMissions(channel, language, this.entity, drankPotion);
	}

	/**
	 * Allow a fighter to block itself
	 * @public
	 */
	public block() {
		BlockingUtils.blockPlayer(this.entity.discordUserId, BlockingConstants.REASONS.FIGHT);
	}

	/**
	 * Return a display of the player in a string format
	 * @param fightTranslationModule
	 */
	public async getStringDisplay(fightTranslationModule: TranslationModule): Promise<string> {

		return fightTranslationModule.format(fighterStatusTranslation[this.status], {
			pseudo: await this.entity.Player.getPseudo(fightTranslationModule.language),
			charging: "" // TODO : add the charging if needed
		}) +
			fightTranslationModule.format("summarize.stats", {
				power: this.stats.fightPoints,
				attack: this.stats.attack,
				defense: this.stats.defense,
				speed: this.stats.speed + " (" + this.stats.agility + ")"
			});
	}

	/**
	 * execute one turn
	 */
	public play(): IFightAction {
		if (this.nextFightActionId !== null) {
			return FightActionController.getFightActionInterface(this.nextFightActionId);
		}
		// Choose action
	}

	/**
	 * get the discord id of a fighter
	 */
	public getDiscordId() {
		return this.entity.discordUserId;
	}

	/**
	 * get the user of a fighter
	 */
	public getUser() {
		return this.user;
	}

	/**
	 * get the pseudo of a fighter
	 * @param language
	 */
	public async getPseudo(language: string) {
		return await this.entity.Player.getPseudo(language);
	}

	/**
	 * check if the player is dead
	 */
	public isDead() {
		return this.stats.fightPoints <= 0;
	}

	/**
	 * check if the player is dead or buggy
	 */
	public isDeadOrBug() {
		return this.isDead() || this.status === FighterStatus.BUG;
	}

	/**
	 * the name of the function is very clear
	 */
	public suicide() {
		this.stats.fightPoints = 0;
	}

	/**
	 * get a map of the fight actions executed and the amont of time it has been done
	 */
	public getFightActionCount() {
		const playerFightActionsHistory = new Map<string, number>();
		this.fightActionsHistory.forEach((action) => {
			if (playerFightActionsHistory.has(action)) {
				playerFightActionsHistory.set(action, playerFightActionsHistory.get(action) + 1);
			}
			else {
				playerFightActionsHistory.set(action, 1);
			}
		});
		return playerFightActionsHistory;
	}

	/**
	 * get the player level of the fighter
	 */
	public getPlayerLevel() {
		return this.entity.Player.level;
	}

	/**
	 * check if the potion of the fighter is a fight potion
	 * @private
	 */
	private async currentPotionIsAFightPotion() {
		return (await this.entity.Player.getMainPotionSlot().getItem() as Potion).isFightPotion();
	}

	/**
	 * Check if the fighter has a fight alteration
	 */
	hasFightAlteration(): boolean {
		return this.alteration !== FighterAlteration.NORMAL;
	}

	/**
	 * get the emoji of the fight alteration
	 */
	public getAlterationEmoji(): string {
		return FightConstants.ALTERATION_EMOJI[this.alteration];
	}

	/**
	 * execute the effect of the alteration that takes place at the beginning of the turn
	 * @param language - the language of the message
	 * @return string - the message to send to the players
	 */
	public processFightAlterationStartTurn(language: string): string {
		const translationModule = Translations.getModule("commands.fight", language);
		let damage: number;
		switch (this.alteration) {
		case FighterAlteration.CONFUSED:
			this.stats.agility = 0;
			return translationModule.get("alteration.confused.startTurn");
		case FighterAlteration.POISONED:
			damage = Math.round(
				FightConstants.POISON_DAMAGE_PER_TURN +
					FightConstants.POISON_DAMAGE_PER_TURN *
					RandomUtils.randInt(-FightConstants.DAMAGE_RANDOM_VARIATION, FightConstants.DAMAGE_RANDOM_VARIATION) / 100);
			this.stats.fightPoints -= damage;
			return translationModule.format("alteration.poisoned.startTurn", {
				damage: damage
			});
		default:
			return "";
		}
	}

	/**
	 * execute the effect of the alteration that takes place at the end of the turn
	 * @param language - the language of the message
	 * @return string - the message to send to the players
	 */
	public processFightAlterationEndTurn(language: string): string {
		const translationModule = Translations.getModule("commands.fight", language);
		switch (this.alteration) {
		case FighterAlteration.CONFUSED:
			this.alteration = FighterAlteration.NORMAL;
			this.stats.agility = this.entity.getAgility(this.stats.defense, this.stats.speed);
			return translationModule.get("alteration.confused.endTurn");
		case FighterAlteration.POISONED:
			if (RandomUtils.randInt(0, 100) < FightConstants.POISON_END_PROBABILITY) {
				this.alteration = FighterAlteration.NORMAL;
				return translationModule.get("alteration.poisoned.endTurn");
			}
			return FightConstants.CANCEL_ALTERATION_DISPLAY;
		default:
			return "";
		}
	}

	/**
	 * Set a new fight alteration to the fighter
	 * @param alteration - the new fight alteration
	 */
	newAlteration(alteration: FighterAlteration) {
		this.alteration = alteration;
	}
}