import {Fighter} from "./fighter/Fighter";
import {FightState} from "./FightState";
import {FightView} from "./FightView";
import {RandomUtils} from "../utils/RandomUtils";
import {FightConstants} from "../constants/FightConstants";
import {TextBasedChannel} from "discord.js";
import {FighterStatus} from "./FighterStatus";
import {draftBotInstance} from "../bot";
import Benediction from "./actions/interfaces/benediction";
import DivineAttack from "./actions/interfaces/divineAttack";
import {FightAction} from "./actions/FightAction";
import {FightActions} from "./actions/FightActions";

/**
 * @class FightController
 */
export class FightController {

	turn: number;

	public readonly fighters: Fighter[];

	public readonly friendly: boolean;

	public readonly fightInitiator: Fighter;

	private readonly _fightView: FightView;

	private state: FightState;

	private endCallback: (fight: FightController, fightLogId: number) => Promise<void>;

	public constructor(fighter1: Fighter, fighter2: Fighter, friendly: boolean, channel: TextBasedChannel, language: string) {
		this.fighters = [fighter1, fighter2];
		this.fightInitiator = fighter1;
		this.state = FightState.NOT_STARTED;
		this.turn = 1;
		this.friendly = friendly;
		this._fightView = new FightView(channel, language, this);
	}

	/**
	 * Count the amount of god moves used by both players
	 * @param sender
	 * @param receiver
	 */
	static getUsedGodMoves(sender: Fighter, receiver: Fighter): number {
		return sender.fightActionsHistory.filter(action => action instanceof Benediction ||
				action instanceof DivineAttack).length
			+ receiver.fightActionsHistory.filter(action =>
				action instanceof Benediction ||
				action instanceof DivineAttack).length;
	}

	/**
	 * Start a fight
	 * @public
	 */
	public async startFight(): Promise<void> {
		// make the fighters ready
		for (let i = 0; i < this.fighters.length; i++) {
			await this.fighters[i].startFight(this._fightView, i === 0);
		}

		// the player with the highest speed start the fight
		if (this.fighters[1].stats.speed > this.fighters[0].stats.speed || RandomUtils.draftbotRandom.bool() && this.fighters[1].stats.speed === this.fighters[0].stats.speed) {
			this.invertFighters();
		}
		await this._fightView.introduceFight(this.fighters[0], this.fighters[1]);
		this.state = FightState.RUNNING;
		await this.prepareNextTurn();
	}

	/**
	 * Get the playing fighter or null if the fight is not running
	 * @return {Fighter|null}
	 */
	public getPlayingFighter(): Fighter {
		return this.state === FightState.RUNNING ? this.fighters[0] : null;
	}

	/**
	 * Get the defending fighter or null if the fight is not running
	 * @return {Fighter|null}
	 */
	public getDefendingFighter(): Fighter {
		return this.state === FightState.RUNNING ? this.fighters[1] : null;
	}

	/**
	 * End the fight
	 */
	public async endFight(): Promise<void> {
		this.state = FightState.FINISHED;

		const fightLogId = await draftBotInstance.logsDatabase.logFight(this);

		this.checkNegativeFightPoints();

		const winner = this.getWinner();
		const isADraw = this.isADraw();

		this._fightView.outroFight(this.fighters[(1 - winner) % 2], this.fighters[winner % 2], isADraw);

		for (let i = 0; i < this.fighters.length; ++i) {
			await this.fighters[i].endFight(this._fightView, i === winner);
		}

		if (this.endCallback) {
			await this.endCallback(this, fightLogId);
		}
	}

	/**
	 * Cancel a fight and unblock the fighters, used when a fight has bugged (for example if a message was deleted)
	 */
	endBugFight(): void {
		this.state = FightState.BUG;
		for (let i = 0; i < this.fighters.length; ++i) {
			this.fighters[i].unblock();
		}
		this._fightView.displayBugFight();
	}

	/**
	 * Get the winner of the fight does not check for draw
	 * @private
	 */
	public getWinner(): number {
		return this.fighters[0].isDead() ? 1 : 0;
	}

	/**
	 * Check if the fight is a draw
	 * @private
	 */
	public isADraw(): boolean {
		return this.fighters[0].isDead() === this.fighters[1].isDead() || this.turn >= FightConstants.MAX_TURNS && !(this.fighters[0].isDead() || this.fighters[1].isDead());
	}

	/**
	 * Execute the next fight action
	 * @param fightAction {FightAction} the fight action to execute
	 * @param endTurn {boolean} true if the turn should be ended after the action has been executed
	 */
	public async executeFightAction(fightAction: FightAction, endTurn: boolean): Promise<void> {
		if (endTurn) {
			this.getPlayingFighter().nextFightAction = null;
		}

		const enoughBreath = this.getPlayingFighter().useBreath(fightAction.getBreathCost());

		if (!enoughBreath && RandomUtils.draftbotRandom.bool(FightConstants.OUT_OF_BREATH_FAILURE_PROBABILITY)) {
			fightAction = FightActions.getFightActionById("outOfBreath");
		}

		const receivedMessage = fightAction.use(this.getPlayingFighter(), this.getDefendingFighter(), this.turn, this._fightView.language);

		await this._fightView.updateHistory(fightAction.getEmoji(), this.getPlayingFighter().getMention(), receivedMessage).catch(
			() => {
				console.log("### FIGHT MESSAGE DELETED OR LOST : updateHistory ###");
				this.endBugFight();
			});
		if (this.state !== FightState.RUNNING) {
			// an error occurred during the update of the history
			return;
		}
		this.getPlayingFighter().fightActionsHistory.push(fightAction);
		if (this.hadEnded()) {
			await this.endFight();
			return;
		}
		if (endTurn) {
			this.turn++;
			this.invertFighters();
			this.getPlayingFighter().regenerateBreath(this.turn < 2);
			await this.prepareNextTurn();
		}
	}

	/**
	 * Check if any of the fighters has negative fight points
	 * @private
	 */
	private checkNegativeFightPoints(): void {
		// set the fight points to 0 if any of the fighters have fight points under 0
		for (const fighter of this.fighters) {
			if (fighter.stats.fightPoints < 0) {
				fighter.stats.fightPoints = 0;
			}
		}
	}

	/**
	 * Execute a turn of a fight
	 * @private
	 */
	private async prepareNextTurn(): Promise<void> {
		if (this.getPlayingFighter().hasFightAlteration()) {
			await this.executeFightAction(this.getPlayingFighter().alteration, false);
		}
		if (this.state !== FightState.RUNNING) {
			// a player was killed by a fight alteration, no need to continue the fight
			return;
		}
		await this._fightView.displayFightStatus().catch(
			() => {
				console.log("### FIGHT MESSAGE DELETED OR LOST : displayFightStatus ###");
				this.endBugFight();
			});
		if (this.state !== FightState.RUNNING) {
			// An issue occurred during the fight status display, no need to continue the fight
			return;
		}
		if (this.getPlayingFighter().nextFightAction === null) {
			try {
				this.getPlayingFighter().chooseAction(this._fightView);
			}
			catch (e) {
				console.log("### FIGHT MESSAGE DELETED OR LOST : displayFightStatus ###");
				this.endBugFight();
			}
		}
		else {
			await this.executeFightAction(this.getPlayingFighter().nextFightAction, true);
		}
	}

	/**
	 * Change who is the player 1 and who is the player 2.
	 * @private
	 */
	private invertFighters(): void {
		const temp = this.fighters[0];
		this.fighters[0] = this.fighters[1];
		this.fighters[1] = temp;
		this.fighters[0].setStatus(FighterStatus.ATTACKER);
		this.fighters[1].setStatus(FighterStatus.DEFENDER);
	}

	/**
	 * Set a callback to be called when the fight ends
	 * @param callback
	 */
	public setEndCallback(callback: (fight: FightController, fightLogId: number) => Promise<void>): void {
		this.endCallback = callback;
	}

	/**
	 * Check if a fight has ended or not
	 * @private
	 */
	private hadEnded(): boolean {
		return (
			this.turn >= FightConstants.MAX_TURNS ||
			this.getPlayingFighter().isDeadOrBug() ||
			this.getDefendingFighter().isDeadOrBug() ||
			this.state !== FightState.RUNNING);
	}

	/**
	 * Get the fight view
	 */
	public getFightView(): FightView {
		return this._fightView;
	}
}
