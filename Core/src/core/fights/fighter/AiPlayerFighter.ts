import {Fighter} from "./Fighter";
import {Player} from "../../database/game/models/Player";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {PlayerActiveObjects} from "../../database/game/models/PlayerActiveObjects";
import {FightView} from "../FightView";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {Class} from "../../../data/Class";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {DraftBotPacket} from "../../../../../Lib/src/packets/DraftBotPacket";
import {ClassBehavior, getAiClassBehavior} from "../AiBehaviorController";
import PetEntity, {PetEntities} from "../../database/game/models/PetEntity";

/**
 * @class AiPlayerFighter
 * @extends Fighter
 * Class representing a player in a fight
 */
export class AiPlayerFighter extends Fighter {
	public player: Player;

	public pet?: PetEntity;

	private class: Class;

	private readonly classBehavior: ClassBehavior;

	private glory: number;

	public constructor(player: Player, playerClass: Class) {
		super(player.level, FightActionDataController.instance.getListById(playerClass.fightActionsIds));
		this.player = player;
		this.class = playerClass;
		this.classBehavior = getAiClassBehavior(playerClass.id);
	}

	/**
	 * The fighter loads its various stats
	 * @public
	 */
	public async loadStats(): Promise<void> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(this.player.id);
		this.stats.energy = this.player.getMaxCumulativeEnergy();
		this.stats.maxEnergy = this.player.getMaxCumulativeEnergy();
		this.stats.attack = this.player.getCumulativeAttack(playerActiveObjects);
		this.stats.defense = this.player.getCumulativeDefense(playerActiveObjects);
		this.stats.speed = this.player.getCumulativeSpeed(playerActiveObjects);
		this.stats.breath = this.player.getBaseBreath();
		this.stats.maxBreath = this.player.getMaxBreath();
		this.stats.breathRegen = this.player.getBreathRegen();
		this.glory = this.player.getGloryPoints();
		if (this.player.petId) {
			this.pet = await PetEntities.getById(this.player.petId);
		}
	}

	/**
	 * Send the embed to choose an action
	 * @param fightView
	 * @param response
	 */
	async chooseAction(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		fightView.displayAiChooseAction(response, RandomUtils.randInt(800, 2500));

		const classBehavior = this.classBehavior;
		// Use the behavior script to choose an action
		let fightAction: FightAction;

		if (classBehavior) {
			fightAction = classBehavior.chooseAction(this, fightView);
		}
		else {
			// Fallback to a simple attack if no behavior is defined
			fightAction = FightActionDataController.instance.getById("simpleAttack");
		}
		await fightView.fightController.executeFightAction(fightAction, true, response);
	}

	endFight(): Promise<void> {
		return Promise.resolve();
	}

	startFight(): Promise<void> {
		return Promise.resolve();
	}

	unblock(): void {
		// Not needed for AI players, they are not blocked during the fight
	}
}