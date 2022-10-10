import {TextBasedChannel, User} from "discord.js";
import {BlockingUtils} from "../utils/BlockingUtils";
import {playerActiveObjects} from "../database/game/models/PlayerActiveObjects";
import Potion from "../database/game/models/Potion";
import {checkDrinkPotionMissions} from "../utils/ItemUtils";
import {TranslationModule} from "../Translations";
import {FighterStatus} from "./FighterStatus";
import {FighterAlterationId} from "./FighterAlterationId";
import {IFightAction} from "../fightActions/IFightAction";
import Class from "../database/game/models/Class";
import {FightActionController} from "../fightActions/FightActionController";
import {BlockingConstants} from "../constants/BlockingConstants";
import {FightConstants} from "../constants/FightConstants";
import Player from "../database/game/models/Player";
import {InventorySlots} from "../database/game/models/InventorySlot";

type FighterStats = {
	fightPoints: number, maxFightPoint: number, speed: number, defense: number, attack: number
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

	public player: Player;

	public alterationTurn: number;

	private statsBackup: FighterStats;

	private ready: boolean;

	private alteration: FighterAlterationId;

	private status: FighterStatus;

	private readonly class: Class;

	private readonly user: User;

	public constructor(user: User, player: Player, playerClass: Class) {
		this.stats = {
			fightPoints: null,
			maxFightPoint: null,
			speed: null,
			defense: null,
			attack: null
		};
		this.statsBackup = null;
		this.player = player;
		this.ready = false;
		this.nextFightActionId = null;
		this.fightActionsHistory = [];
		this.status = FighterStatus.NOT_STARTED;
		this.alteration = FighterAlterationId.NORMAL;
		this.alterationTurn = 0;
		this.class = playerClass;
		this.availableFightActions = FightActionController.listFightActionsFromClass(this.class);
		this.user = user;
	}

	/**
	 * get the string that mention the user
	 * @public
	 */
	public getMention(): string {
		return this.player.getMention();
	}

	/**
	 * set the status of the fighter
	 * @param newStatus
	 */
	setStatus(newStatus: FighterStatus): void {
		this.status = newStatus;
	}

	/**
	 * the fighter loads its various stats
	 * @param friendly true if the fight is friendly
	 * @public
	 */
	public async loadStats(friendly: boolean): Promise<void> {
		const playerActiveObjects: playerActiveObjects = await InventorySlots.getPlayerActiveObjects(this.player.id);
		this.stats.fightPoints = friendly ? await this.player.getMaxCumulativeFightPoint() : await this.player.getCumulativeFightPoint();
		this.stats.maxFightPoint = await this.player.getMaxCumulativeFightPoint();
		this.stats.attack = await this.player.getCumulativeAttack(playerActiveObjects);
		this.stats.defense = await this.player.getCumulativeDefense(playerActiveObjects);
		this.stats.speed = await this.player.getCumulativeSpeed(playerActiveObjects);
	}

	/**
	 * delete the potion from the inventory of the player if needed
	 * @param friendly true if the fight is friendly
	 * @param channel
	 * @param language
	 * @public
	 */
	public async consumePotionIfNeeded(friendly: boolean, channel: TextBasedChannel, language: string): Promise<void> {
		const inventorySlots = await InventorySlots.getOfPlayer(this.player.id);
		const drankPotion = await inventorySlots.find(slot => slot.isPotion() && slot.isEquipped()).getItem() as Potion;
		if (friendly || !drankPotion.isFightPotion()) {
			return;
		}
		await this.player.drinkPotion();
		await this.player.save();
		await checkDrinkPotionMissions(channel, language, this.player, drankPotion, inventorySlots);
	}

	/**
	 * Allow a fighter to block itself
	 * @public
	 */
	public block(): void {
		BlockingUtils.blockPlayer(this.player.discordUserId, BlockingConstants.REASONS.FIGHT);
	}

	/**
	 * save the stats of the fighter to the backup stat storage
	 */
	public saveStats(): void {
		this.statsBackup = {...this.stats};
	}

	/**
	 * recover the stats of the fighter from the backup stat storage
	 */
	public readSavedStats(): FighterStats {
		return this.statsBackup;
	}

	/**
	 * erase the saved stats of the fighter
	 */
	eraseSavedStats(): void {
		this.statsBackup = null;
	}

	/**
	 * check if a fighter has an active backup of its stats
	 */
	hasSavedStats(): boolean {
		return this.statsBackup !== null;
	}

	/**
	 * Return a display of the player in a string format
	 * @param fightTranslationModule
	 */
	public getStringDisplay(fightTranslationModule: TranslationModule): string {
		return fightTranslationModule.format(
			fighterStatusTranslation[this.status],
			{
				pseudo: this.player.getPseudo(fightTranslationModule.language),
				charging: "" // TODO : add the charging if needed
			}
		) + fightTranslationModule.format("summarize.stats", {
			power: this.stats.fightPoints,
			attack: this.stats.attack,
			defense: this.stats.defense,
			speed: this.stats.speed
		});
	}

	/**
	 * execute one turn
	 */
	public async play(): Promise<IFightAction> {
		if (this.nextFightActionId !== null) {
			return await FightActionController.getFightActionInterface(this.nextFightActionId);
		}
		// Choose action
	}

	/**
	 * get the discord id of a fighter
	 */
	public getDiscordId(): string {
		return this.player.discordUserId;
	}

	/**
	 * get the user of a fighter
	 */
	public getUser(): User {
		return this.user;
	}

	/**
	 * get the pseudo of a fighter
	 * @param language
	 */
	public getPseudo(language: string): string {
		return this.player.getPseudo(language);
	}

	/**
	 * check if the player is dead
	 */
	public isDead(): boolean {
		return this.stats.fightPoints <= 0;
	}

	/**
	 * check if the player is dead or buggy
	 */
	public isDeadOrBug(): boolean {
		return this.isDead() || this.status === FighterStatus.BUG;
	}

	/**
	 * the name of the function is very clear
	 */
	public suicide(): void {
		this.stats.fightPoints = 0;
	}

	/**
	 * get a map of the fight actions executed and the amont of time it has been done
	 */
	public getFightActionCount(): Map<string, number> {
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
	public getPlayerLevel(): number {
		return this.player.level;
	}

	/**
	 * Check if the fighter has a fight alteration
	 */
	hasFightAlteration(): boolean {
		return this.alteration !== FighterAlterationId.NORMAL;
	}

	/**
	 * Set a new fight alteration to the fighter
	 * @param alteration - the new fight alteration
	 * returns the FighterAlterationId of the fight alteration that was set or kept
	 */
	newAlteration(alteration: FighterAlterationId): FighterAlterationId {
		if (this.alteration === FighterAlterationId.NORMAL || this.alteration === alteration) {
			this.alterationTurn = 0;
		}
		if (this.alteration === FighterAlterationId.NORMAL || alteration === FighterAlterationId.NORMAL) {
			// check for alteration conflict
			this.alteration = alteration;
		}
		return this.alteration;
	}

	/**
	 * get the fightAction linked to the alteration of the fighter
	 */
	async getAlterationFightAction(): Promise<IFightAction> {
		const alterationFightActionFileName: string = FightConstants.ALTERATION_FIGHT_ACTION[this.alteration];
		return await FightActionController.getFightActionInterface(alterationFightActionFileName);
	}

	/**
	 * get a random fight action id from the list of available fight actions of the fighter
	 */
	getRandomAvailableFightActionId(): string {
		return Array.from(this.availableFightActions.keys())[Math.floor(Math.random() * Array.from(this.availableFightActions.keys()).length)];
	}
}