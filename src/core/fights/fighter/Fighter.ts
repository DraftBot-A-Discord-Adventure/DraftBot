import {TranslationModule} from "../../Translations";
import {FighterStatus} from "../FighterStatus";
import {FighterAlterationId} from "../FighterAlterationId";
import {IFightAction} from "../../fightActions/IFightAction";
import {FightActionController} from "../../fightActions/FightActionController";
import {FightConstants} from "../../constants/FightConstants";
import {FightView} from "../FightView";

type FighterStats = {
	fightPoints: number, maxFightPoint: number, speed: number, defense: number, attack: number
}

const fighterStatusTranslation = ["summarize.notStarted", "summarize.attacker", "summarize.defender", "summarize.winner", "summarize.loser", "summarize.drawer", "summarize.bug"];

/**
 * @class Fighter
 */
export abstract class Fighter {

	public stats: FighterStats;

	public nextFightActionId: string;

	public fightActionsHistory: string[];

	public availableFightActions: Map<string, IFightAction>;

	public alterationTurn: number;

	private statsBackup: FighterStats;

	private ready: boolean;

	private alteration: FighterAlterationId;

	protected status: FighterStatus;

	protected constructor(availableFightActions: Map<string, IFightAction>) {
		this.stats = {
			fightPoints: null,
			maxFightPoint: null,
			speed: null,
			defense: null,
			attack: null
		};
		this.statsBackup = null;
		this.ready = false;
		this.nextFightActionId = null;
		this.fightActionsHistory = [];
		this.status = FighterStatus.NOT_STARTED;
		this.alteration = FighterAlterationId.NORMAL;
		this.alterationTurn = 0;
		this.availableFightActions = availableFightActions;
	}

	/**
	 * get the string referring to the fighter name
	 * @public
	 */
	abstract getName(): string;

	/**
	 * get the mention of a fighter
	 */
	abstract getMention(): string;

	/**
	 * Make the fighter choose his next action
	 * @param fightView
	 */
	abstract chooseAction(fightView: FightView): void;

	/**
	 * Function called when the fight starts
	 */
	abstract startFight(fightView: FightView): Promise<void>;

	/**
	 * Function called when the fight ends
	 * @param fightView
	 * @param winner Indicate if the fighter is the winner
	 */
	abstract endFight(fightView: FightView, winner: boolean): Promise<void>;

	/**
	 * set the status of the fighter
	 * @param newStatus
	 */
	setStatus(newStatus: FighterStatus): void {
		this.status = newStatus;
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
				pseudo: this.getName(),
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