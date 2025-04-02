import {Fighter} from "./Fighter";
import Player, {Players} from "../../database/game/models/Player";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {PlayerActiveObjects} from "../../database/game/models/PlayerActiveObjects";
import {checkDrinkPotionMissions} from "../../utils/ItemUtils";
import {BlockingUtils} from "../../utils/BlockingUtils";
import {BlockingConstants} from "../../../../../Lib/src/constants/BlockingConstants";
import {FightView} from "../FightView";
import {MissionsController} from "../../missions/MissionsController";
import {MissionSlots} from "../../database/game/models/MissionSlot";
import {getDayNumber} from "../../../../../Lib/src/utils/TimeUtils";
import {NumberChangeReason} from "../../../../../Lib/src/constants/LogsConstants";
import {FighterStatus} from "../FighterStatus";
import {Maps} from "../../maps/Maps";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {PVEConstants} from "../../../../../Lib/src/constants/PVEConstants";
import {Class} from "../../../data/Class";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {DraftBotPacket} from "../../../../../Lib/src/packets/DraftBotPacket";
import {Potion} from "../../../data/Potion";
import PetEntity, {PetEntities} from "../../database/game/models/PetEntity";


/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * @class PlayerFighter
 * @augments Fighter
 * Class representing a player in a fight
 */
export class PlayerFighter extends Fighter {
	public player: Player;

	public pet?: PetEntity;

	private class: Class;

	private glory: number;

	private pveMembers: { attack: number, speed: number }[];

	public constructor(player: Player, playerClass: Class) {
		super(player.level, FightActionDataController.instance.getListById(playerClass.fightActionsIds));
		this.player = player;
		this.class = playerClass;
	}

	/**
	 * Function called when the fight starts
	 * @param fightView The fight view
	 * @param startStatus The first status of a player
	 */
	async startFight(fightView: FightView, startStatus: FighterStatus): Promise<void> {
		this.status = startStatus;
		await this.consumePotionIfNeeded([fightView.context]);
		this.block();
	}

	/**
	 * Function called when the fight ends
	 * @param fightView
	 * @param winner Indicate if the fighter is the winner
	 * @param response
	 */
	async endFight(fightView: FightView, winner: boolean, response: DraftBotPacket[]): Promise<void> {
		this.unblock();
		await this.manageMissionsOf(fightView, response);
		if (winner) {
			await MissionsController.update(this.player, response, {
				missionId: "fightHealthPercent", params: {
					remainingPercent: this.stats.energy / this.stats.maxEnergy
				}
			});
			await MissionsController.update(this.player, response, {
				missionId: "finishWithAttack",
				params: {
					lastAttack: this.fightActionsHistory.at(-1)
				}
			});
		}
	}

	/**
	 * Allow a fighter to unblock itself
	 * @public
	 */
	unblock(): void {
		BlockingUtils.unblockPlayer(this.player.keycloakId, BlockingConstants.REASONS.FIGHT);
	}

	/**
	 * The fighter loads its various stats
	 * @public
	 */
	public async loadStats(): Promise<void> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(this.player.id);
		this.stats.energy = this.player.getCumulativeEnergy();
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
	 * Delete the potion from the inventory of the player if needed
	 * @param response
	 * @public
	 */
	public async consumePotionIfNeeded(response: DraftBotPacket[]): Promise<void> {
		const inventorySlots = await InventorySlots.getOfPlayer(this.player.id);
		const drankPotion = inventorySlots.find(slot => slot.isPotion() && slot.isEquipped())
			.getItem() as Potion;
		if (!drankPotion.isFightPotion()) {
			return;
		}
		await this.player.drinkPotion();
		await this.player.save();
		await checkDrinkPotionMissions(response, this.player, drankPotion, await InventorySlots.getOfPlayer(this.player.id));
	}

	/**
	 * Allow a fighter to block itself
	 * @public
	 */
	public block(): void {
		BlockingUtils.blockPlayer(this.player.keycloakId, BlockingConstants.REASONS.FIGHT);
	}

	/**
	 * Send the embed to choose an action
	 * @param fightView
	 * @param response
	 */
	async chooseAction(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		const actions: Map<string, FightAction> = new Map(this.availableFightActions);

		// Add guild attack if on PVE island and members are here
		if (Maps.isOnPveIsland(this.player)) {
			if (!this.pveMembers) {
				const members = await Maps.getGuildMembersOnPveIsland(this.player);
				this.pveMembers = [];
				for (const member of members) {
					const memberActiveObjects = await InventorySlots.getMainSlotsItems(member.id);
					this.pveMembers.push({
						attack: member.getCumulativeAttack(memberActiveObjects),
						speed: member.getCumulativeSpeed(memberActiveObjects)
					});
				}
			}

			if (this.pveMembers.length !== 0 && RandomUtils.draftbotRandom.realZeroToOneInclusive() < PVEConstants.GUILD_ATTACK_PROBABILITY) {
				actions.set("guildAttack", FightActionDataController.instance.getById("guildAttack"));
			}
		}
		fightView.displayFightActionMenu(response, this, actions);
	}

	/**
	 * Get the members of the player's guild on the island of the fighter
	 */
	public getPveMembersOnIsland(): { attack: number, speed: number }[] {
		return this.pveMembers;
	}

	/**
	 * Check the fight action history of a fighter
	 * @private
	 * @param fightView The fight view
	 */
	private async checkFightActionHistory(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		const playerFightActionsHistory: Map<string, number> = this.getFightActionCount();
		// Iterate on each action in the history
		for (const [action, count] of playerFightActionsHistory) {
			await MissionsController.update(this.player, response, {
				missionId: "fightAttacks",
				count, params: {attackType: action}
			});
		}
	}

	/**
	 * Manage the mission of a fighter
	 * @private
	 * @param fightView
	 * @param response
	 */
	private async manageMissionsOf(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		const newPlayer = await Players.getOrRegister(this.player.keycloakId);
		newPlayer.setEnergyLost(this.stats.maxEnergy - this.stats.energy, NumberChangeReason.FIGHT);
		await newPlayer.save();

		await this.checkFightActionHistory(fightView, response);

		await MissionsController.update(this.player, response, {missionId: "anyFight"});

		const slots = await MissionSlots.getOfPlayer(this.player.id);
		for (const slot of slots) {
			if (slot.missionId === "fightStreak") {
				const lastDay = slot.saveBlob ? slot.saveBlob.readInt32LE() : 0;
				const currDay = getDayNumber();
				if (lastDay === currDay - 1) {
					await MissionsController.update(this.player, response, {missionId: "fightStreak"});
				}
				else if (lastDay !== currDay) {
					await MissionsController.update(this.player, response, {
						missionId: "fightStreak",
						count: 1,
						set: true
					});
				}
			}
		}
	}
}