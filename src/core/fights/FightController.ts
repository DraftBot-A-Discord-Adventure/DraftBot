import {Fighter} from "./fighter/Fighter";
import {FightState} from "./FightState";
import {FightView} from "./FightView";
import {RandomUtils} from "../utils/RandomUtils";
import {FightConstants} from "../constants/FightConstants";
import {TextBasedChannel} from "discord.js";
import {FighterStatus} from "./FighterStatus";
import {IFightAction} from "../fightActions/IFightAction";
import {FightActionController} from "../fightActions/FightActionController";
import {draftBotInstance} from "../bot";

/**
 * @class FightController
 */
export class FightController {

	turn: number;

	public readonly fighters: Fighter[];

	public readonly friendly: boolean;

	public readonly fightInitiator: Fighter;

	private readonly fightView: FightView;

	private state: FightState;

	public constructor(fighter1: Fighter, fighter2: Fighter, friendly: boolean, channel: TextBasedChannel, language: string) {
		this.fighters = [fighter1, fighter2];
		this.fightInitiator = fighter1;
		this.state = FightState.NOT_STARTED;
		this.turn = 1;
		this.friendly = friendly;
		this.fightView = new FightView(channel, language, this);
	}

	/**
	 * Count the amount of god moves used by both players
	 * @param sender
	 * @param receiver
	 */
	static getUsedGodMoves(sender: Fighter, receiver: Fighter): number {
		return sender.fightActionsHistory.filter(action => action === FightConstants.ACTION_ID.BENEDICTION ||
				action === FightConstants.ACTION_ID.DIVINE_ATTACK).length
			+ receiver.fightActionsHistory.filter(action =>
				action === FightConstants.ACTION_ID.BENEDICTION ||
				action === FightConstants.ACTION_ID.DIVINE_ATTACK).length;
	}

	/**
	 * start a fight
	 * @public
	 */
	public async startFight(): Promise<void> {
		// make the fighters ready
		for (let i = 0; i < this.fighters.length; i++) {
			await this.fighters[i].startFight(this.fightView);
		}

		// the player with the highest speed start the fight
		if (this.fighters[1].stats.speed > this.fighters[0].stats.speed || RandomUtils.draftbotRandom.bool() && this.fighters[1].stats.speed === this.fighters[0].stats.speed) {
			this.invertFighters();
		}
		await this.fightView.introduceFight(this.fighters[0], this.fighters[1]);
		this.state = FightState.RUNNING;
		await this.prepareNextTurn();
	}

	/**
	 * Get the playing fighter or null if the fight is not running
	 * @return {Fighter|null}
	 */
	public getPlayingFighter(): Fighter {
		return this.state === FightState.RUNNING ? this.fighters[(this.turn - 1) % 2] : null;
	}

	/**
	 * Get the defending fighter or null if the fight is not running
	 * @return {Fighter|null}
	 */
	public getDefendingFighter(): Fighter {
		return this.state === FightState.RUNNING ? this.fighters[this.turn % 2] : null;
	}

	/**
	 * End the fight
	 */
	public async endFight(): Promise<void> {
		this.state = FightState.FINISHED;

		draftBotInstance.logsDatabase.logFight(this).then();

		this.checkNegativeFightPoints();

		const winner = this.getWinner();
		const isADraw = this.isADraw();

		this.fightView.outroFight(this.fighters[(1 - winner) % 2], this.fighters[winner % 2], isADraw);

		for (let i = 0; i < this.fighters.length; ++i) {
			await this.fighters[i].endFight(this.fightView, i === winner);
		}
	}

	/**
	 * Get the winner of the fight (or null if it's a draw)
	 * @private
	 */
	public getWinner(): number {
		return this.fighters[0].isDead() ? 1 : 0;
	}

	/**
	 * check if the fight is a draw
	 * @private
	 */
	public isADraw(): boolean {
		return this.fighters[0].isDead() === this.fighters[1].isDead() || this.turn >= FightConstants.MAX_TURNS && !(this.fighters[0].isDead() || this.fighters[1].isDead());
	}

	/**
	 * execute the next fight action
	 * @param fightAction {IFightAction} the fight action to execute
	 * @param endTurn {boolean} true if the turn should be ended after the action has been executed
	 */
	public async executeFightAction(fightAction: IFightAction, endTurn: boolean): Promise<void> {
		if (endTurn) {
			this.getPlayingFighter().nextFightActionId = null;
		}
		const receivedMessage = fightAction.use(this.getPlayingFighter(), this.getDefendingFighter(), this.turn, this.fightView.language);
		await this.fightView.updateHistory(fightAction.getEmoji(), this.getPlayingFighter().getMention(), receivedMessage);
		this.getPlayingFighter().fightActionsHistory.push(fightAction.getName());
		if (this.hadEnded()) {
			await this.endFight();
			return;
		}
		if (endTurn) {
			this.turn++;
			await this.prepareNextTurn();
		}
	}

	/**
	 * check if any of the fighters has negative fight points
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
	 * execute a turn of a fight
	 * @private
	 */
	private async prepareNextTurn(): Promise<void> {
		if (this.getPlayingFighter().hasFightAlteration()) {
			await this.executeFightAction(await this.getPlayingFighter().getAlterationFightAction(), false);
		}
		if (this.state !== FightState.RUNNING) {
			// a player was killed by a fight alteration, no need to continue the fight
			return;
		}
		await this.fightView.displayFightStatus();
		if (this.getPlayingFighter().nextFightActionId === null) {
			this.getPlayingFighter().chooseAction(this.fightView);
		}
		else {
			await this.executeFightAction(await FightActionController.getFightActionInterface(this.getPlayingFighter().nextFightActionId), true);
		}
	}

	/**
	 * Change who is the player 1 and who is the player 2.
	 * The player 1 start the fight.
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
	 * check if a fight has ended or not
	 * @private
	 */
	private hadEnded(): boolean {
		return (
			this.turn >= FightConstants.MAX_TURNS ||
			this.getPlayingFighter().isDeadOrBug() ||
			this.getDefendingFighter().isDeadOrBug() ||
			this.state !== FightState.RUNNING);
	}
}
