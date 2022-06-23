import Entity, {Entities} from "../models/Entity";
import {TextBasedChannel, User} from "discord.js";
import {BlockingUtils} from "../utils/BlockingUtils";
import {playerActiveObjects} from "../models/PlayerActiveObjects";
import {Tags} from "../models/Tag";
import Potion from "../models/Potion";
import {MissionsController} from "../missions/MissionsController";
import {countNbOfPotions} from "../utils/ItemUtils";
import {TranslationModule} from "../Translations";
import {FighterStatus} from "./FighterStatus";
import {IFightAction} from "../attacks/IFightAction";
import Class from "../models/Class";
import {FightActionController} from "../attacks/FightActionController";
import {BlockingConstants} from "../constants/BlockingConstants";

type FighterStats = { fightPoints: number, maxFightPoint: number, speed: number, defense: number, attack: number }

const fighterStatusTranslation = ["summarize.notStarted", "summarize.attacker", "summarize.defender", "summarize.winner", "summarize.loser", "summarize.drawer", "summarize.bug"];

/**
 * @class Fighter
 */
export class Fighter {

	public stats: FighterStats

	public nextFightActionId: string;

	public fightActionsHistory: string[];

	public availableFightActions: Map<string, IFightAction>;

	private entity: Entity

	private ready: boolean

	private status: FighterStatus

	private readonly class: Class;

	private readonly user: User;

	public constructor(user: User, entity: Entity, playerClass: Class) {
		this.stats = {fightPoints: null, maxFightPoint: null, speed: null, defense: null, attack: null};
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
		const tagsToVerify = await Tags.findTagsFromObject((await this.entity.Player.getMainPotionSlot().getItem()).id, Potion.name);
		if (tagsToVerify) {
			for (let i = 0; i < tagsToVerify.length; i++) {
				await MissionsController.update(this.entity.discordUserId, channel, language, tagsToVerify[i].textTag, 1, {tags: tagsToVerify});
			}
		}
		await this.entity.Player.drinkPotion();
		await MissionsController.update(this.entity.discordUserId, channel, language, "drinkPotion");
		const potionSlot = this.entity.Player.getMainPotionSlot();
		if (potionSlot) {
			await MissionsController.update(this.entity.discordUserId, channel, language, "drinkPotionRarity", 1, { rarity: (await potionSlot.getItem()).rarity });
		}
		[this.entity] = await Entities.getOrRegister(this.entity.discordUserId);
		await MissionsController.update(this.entity.discordUserId, channel, language, "havePotions", countNbOfPotions(this.entity.Player), null, true);
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
				speed: this.stats.speed
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
	getDiscordId() {
		return this.entity.discordUserId;
	}

	/**
	 * get the user of a fighter
	 */
	getUser() {
		return this.user;
	}

	/**
	 * get the pseudo of a fighter
	 * @param language
	 */
	async getPseudo(language: string) {
		return await this.entity.Player.getPseudo(language);
	}

	/**
	 * check if the player is dead
	 */
	isDead() {
		return this.stats.fightPoints <= 0;
	}

	/**
	 * check if the player is dead or buggy
	 */
	isDeadOrBug() {
		return this.isDead() || this.status === FighterStatus.BUG;
	}

	/**
	 * the name of the function is very clear
	 */
	suicide() {
		this.stats.fightPoints = 0;
	}

	/**
	 * get a map of the fight actions executed and the amont of time it has been done
	 */
	getFightActionCount() {
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
	 * check if the potion of the fighter is a fight potion
	 * @private
	 */
	private async currentPotionIsAFightPotion() {
		return (await this.entity.Player.getMainPotionSlot().getItem() as Potion).isFightPotion();
	}
}