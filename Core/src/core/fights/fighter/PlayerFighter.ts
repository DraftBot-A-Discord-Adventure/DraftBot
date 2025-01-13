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

/* eslint-disable capitalized-comments */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * @class PlayerFighter
 * @extends Fighter
 * Class representing a player in a fight
 */
export class PlayerFighter extends Fighter {
	public player: Player;

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
		await this.consumePotionIfNeeded(fightView.fightController.friendly, [fightView.context]);
		this.block();
	}

	/**
	 * Function called when the fight ends
	 * @param fightView
	 * @param winner Indicate if the fighter is the winner
	 */
	async endFight(fightView: FightView, winner: boolean): Promise<void> {
		this.unblock();
		await this.manageMissionsOf(fightView);
		if (winner) {
			await MissionsController.update(this.player, [fightView.context], {
				missionId: "fightHealthPercent", params: {
					remainingPercent: this.stats.fightPoints / this.stats.maxFightPoint
				}
			});
			await MissionsController.update(this.player, [fightView.context], {
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
		BlockingUtils.unblockPlayer(this.player.id, BlockingConstants.REASONS.FIGHT);
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
	 * Delete the potion from the inventory of the player if needed
	 * @param friendly true if the fight is friendly
	 * @param response
	 * @public
	 */
	public async consumePotionIfNeeded(friendly: boolean, response: DraftBotPacket[]): Promise<void> {
		const inventorySlots = await InventorySlots.getOfPlayer(this.player.id);
		const drankPotion = inventorySlots.find(slot => slot.isPotion() && slot.isEquipped())
			.getItem() as Potion;
		if (friendly || !drankPotion.isFightPotion()) {
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
		BlockingUtils.blockPlayer(this.player.id, BlockingConstants.REASONS.FIGHT);
	}

	/**
	 * Send the embed to choose an action
	 * @param fightView
	 */
	async chooseAction(fightView: FightView): Promise<void> {
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
		this.sendChooseActionEmbed(fightView)
			.then(this.chooseActionCallback(actions, fightView));
	}

	/* /!**
	 * Return a display of the player in a string format
	 * @param fightTranslationModule
	 *!/
	public getStringDisplay(fightTranslationModule: TranslationModule): string {
		return fightTranslationModule.format(
			this.status.getTranslationField(),
			{
				pseudo: this.getName(),
				glory: this.glory,
				class: this.class.getName(fightTranslationModule.language)
			}
		) + fightTranslationModule.format("summarize.stats", {
			power: this.getFightPoints(),
			attack: this.getAttack(),
			defense: this.getDefense(),
			speed: this.getSpeed(),
			breath: this.getBreath(),
			maxBreath: this.getMaxBreath(),
			breathRegen: this.getRegenBreath()
		});
	} */

	/**
	 * Get the members of the guild of the player on the island of the fighter
	 */
	public getPveMembersOnIsland(): { attack: number, speed: number }[] {
		return this.pveMembers;
	}

	private chooseActionCallback(actions: Map<string, FightAction>, fightView: FightView): () => void { // (m: Message) => void {
		return null;
		// TODO
		/* return (chooseActionEmbedMessage: Message): void => {
			const collector = chooseActionEmbedMessage.createReactionCollector({
				filter: (reaction) => reaction.me && reaction.users.cache.last().id === this.getDiscordId(),
				time: FightConstants.TIME_FOR_ACTION_SELECTION,
				max: 1
			});
			collector.on("end", async (reaction) => {
				const emoji = reaction.first()?.emoji.name;
				const selectedAction = Array.from(actions.values())
					.find((action) => emoji && action.getEmoji() === emoji);
				try {
					await chooseActionEmbedMessage.delete();
					if (!selectedAction) {
						// USER HASN'T SELECTED AN ACTION
						this.kill();
						await fightView.fightController.endFight();
						return;
					}
					await fightView.fightController.executeFightAction(selectedAction, true);
				} catch (e) {
					console.log("### FIGHT MESSAGE DELETED OR LOST : actionMessage ###");
					fightView.fightController.endBugFight();
				}
			});
			const reactions = [];
			for (const [, action] of actions) {
				reactions.push(chooseActionEmbedMessage.react(action.getEmoji()));
			}

			Promise.all(reactions)
				.catch(() => null);
		};*/
	}

	/**
	 * Check the fight action history of a fighter
	 * @private
	 * @param fightView The fight view
	 */
	private async checkFightActionHistory(fightView: FightView): Promise<void> {
		const playerFightActionsHistory: Map<string, number> = this.getFightActionCount();
		// Iterate on each action in the history
		for (const [action, count] of playerFightActionsHistory) {
			await MissionsController.update(this.player, [fightView.context], {
				missionId: "fightAttacks",
				count, params: {attackType: action}
			});
		}
	}

	/**
	 * Manage the mission of a fighter
	 * @private
	 * @param fightView
	 */
	private async manageMissionsOf(fightView: FightView): Promise<void> {
		if (!fightView.fightController.friendly) {
			const newPlayer = await Players.getOrRegister(this.player.keycloakId);
			newPlayer.setFightPointsLost(this.stats.maxFightPoint - this.stats.fightPoints, NumberChangeReason.FIGHT);
			await newPlayer.save();
		}

		await this.checkFightActionHistory(fightView);

		await MissionsController.update(this.player, [fightView.context], {missionId: "anyFight"});

		const slots = await MissionSlots.getOfPlayer(this.player.id);
		for (const slot of slots) {
			if (slot.missionId === "fightStreak") {
				const lastDay = slot.saveBlob ? slot.saveBlob.readInt32LE() : 0;
				const currDay = getDayNumber();
				if (lastDay === currDay - 1) {
					await MissionsController.update(this.player, [fightView.context], {missionId: "fightStreak"});
				}
				else if (lastDay !== currDay) {
					await MissionsController.update(this.player, [fightView.context], {
						missionId: "fightStreak",
						count: 1,
						set: true
					});
				}
			}
		}
	}

	/**
	 * Send the choose action embed message
	 * @private
	 * @param fightView
	 */
	private async sendChooseActionEmbed(fightView: FightView): Promise<void> {
		/* const chooseActionEmbed = new DraftBotEmbed();
		chooseActionEmbed.formatAuthor(fightView.fightTranslationModule.format("turnIndicationsTitle", {pseudo: this.getName()}), this.getUser());
		chooseActionEmbed.setDescription(fightView.fightTranslationModule.get("turnIndicationsDescription"));
		return await fightView.channel.send({embeds: [chooseActionEmbed]}); */
	}
}