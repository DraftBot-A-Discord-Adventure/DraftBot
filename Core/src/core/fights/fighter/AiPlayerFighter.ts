import {Fighter} from "./Fighter";
import {Player} from "../../database/game/models/Player";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {PlayerActiveObjects} from "../../database/game/models/PlayerActiveObjects";
import {FightView} from "../FightView";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {Class} from "../../../data/Class";
import {FightActionDataController} from "../../../data/FightAction";
import {DraftBotPacket} from "../../../../../Lib/src/packets/DraftBotPacket";

/**
 * @class AiPlayerFighter
 * @extends Fighter
 * Class representing a player in a fight
 */
export class AiPlayerFighter extends Fighter {
	public player: Player;

	private class: Class;

	private glory: number;

	public constructor(player: Player, playerClass: Class) {
		super(player.level, FightActionDataController.instance.getListById(playerClass.fightActionsIds));
		this.player = player;
		this.class = playerClass;
	}

	/**
	 * The fighter loads its various stats
	 * @public
	 */
	public async loadStats(): Promise<void> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(this.player.id);
		this.stats.fightPoints = this.player.getCumulativeFightPoint();
		this.stats.maxFightPoint = this.player.getMaxCumulativeFightPoint();
		this.stats.attack = this.player.getCumulativeAttack(playerActiveObjects);
		this.stats.defense = this.player.getCumulativeDefense(playerActiveObjects);
		this.stats.speed = this.player.getCumulativeSpeed(playerActiveObjects);
		this.stats.breath = this.player.getBaseBreath();
		this.stats.maxBreath = this.player.getMaxBreath();
		this.stats.breathRegen = this.player.getBreathRegen();
		this.glory = this.player.getGloryPoints();
	}

	/**
	 * Send the embed to choose an action
	 * @param fightView
	 * @param response
	 */
	chooseAction(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		fightView.displayAiChooseAction(response);
		const fightAction = FightActionDataController.instance.getById("simpleAttack");
		setTimeout(async function() {
			await fightView.fightController.executeFightAction(fightAction, true, response);
		}, RandomUtils.draftbotRandom.integer(800, 2500));
		return Promise.resolve();
	}

	endFight(): Promise<void> {
		return Promise.resolve();
	}

	startFight(): Promise<void> {
		return Promise.resolve();
	}

	unblock(): void {
	}
}