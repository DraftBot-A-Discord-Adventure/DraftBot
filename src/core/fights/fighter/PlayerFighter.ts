import {Fighter} from "./Fighter";
import Player from "../../database/game/models/Player";
import Class from "../../database/game/models/Class";
import {Collection, Message, MessageReaction, Snowflake, TextBasedChannel, User} from "discord.js";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {playerActiveObjects} from "../../database/game/models/PlayerActiveObjects";
import Potion from "../../database/game/models/Potion";
import {checkDrinkPotionMissions} from "../../utils/ItemUtils";
import {BlockingUtils} from "../../utils/BlockingUtils";
import {BlockingConstants} from "../../constants/BlockingConstants";
import {FightConstants} from "../../constants/FightConstants";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {FightView} from "../FightView";
import {MissionsController} from "../../missions/MissionsController";
import {MissionSlots} from "../../database/game/models/MissionSlot";
import {getDayNumber} from "../../utils/TimeUtils";
import {FightActions} from "../actions/FightActions";
import {FightAction} from "../actions/FightAction";

/**
 * @class PlayerFighter
 * @extends Fighter
 * Class representing a player in a fight
 */
export class PlayerFighter extends Fighter {
	public player: Player;

	private readonly class: Class;

	private readonly user: User;

	public constructor(user: User, player: Player, playerClass: Class) {
		super(FightActions.listFightActionsFromClass(playerClass));
		this.player = player;
		this.class = playerClass;
		this.user = user;
	}

	/**
	 * Get the pseudo
	 */
	getName(): string {
		return this.player.getPseudo(undefined);
	}

	/**
	 * Get the mention
	 */
	getMention(): string {
		return this.player.getMention();
	}

	/**
	 * Function called when the fight starts
	 * @param fightView The fight view
	 */
	async startFight(fightView: FightView): Promise<void> {
		await this.consumePotionIfNeeded(fightView.fightController.friendly, fightView.channel, fightView.language);
		this.block();
	}


	/**
	 * check the fight action history of a fighter
	 * @private
	 * @param fightView The fight view
	 */
	private async checkFightActionHistory(fightView: FightView): Promise<void> {
		const playerFightActionsHistory: Map<string, number> = this.getFightActionCount();
		// iterate on each action in the history
		for (const [action, count] of playerFightActionsHistory) {
			await MissionsController.update(this.player, fightView.channel, fightView.language, {
				missionId: "fightAttacks",
				count, params: {attackType: action}
			});
		}
	}

	/**
	 * manage the mission of a fighter
	 * @private
	 * @param fightView
	 */
	private async manageMissionsOf(fightView: FightView): Promise<void> {
		await this.checkFightActionHistory(fightView);
		// TODO : REDO WHEN RANKED FIGHTS ARE IMPLEMENTED
		await MissionsController.update(this.player, fightView.channel, fightView.language, {missionId: "friendlyFight"});
		await MissionsController.update(this.player, fightView.channel, fightView.language, {missionId: "rankedFight"});
		await MissionsController.update(this.player, fightView.channel, fightView.language, {missionId: "anyFight"});

		const slots = await MissionSlots.getOfPlayer(this.player.id);
		for (const slot of slots) {
			if (slot.missionId === "fightStreak") {
				const lastDay = slot.saveBlob ? slot.saveBlob.readInt32LE() : 0;
				const currDay = getDayNumber();
				if (lastDay === currDay - 1) {
					await MissionsController.update(this.player, fightView.channel, fightView.language, { missionId: "fightStreak" });
				}
				else if (lastDay !== currDay) {
					await MissionsController.update(this.player, fightView.channel, fightView.language, { missionId: "fightStreak", count: 1, set: true });
				}
			}
		}
	}

	/**
	 * Function called when the fight ends
	 * @param fightView
	 * @param winner Indicate if the fighter is the winner
	 */
	async endFight(fightView: FightView, winner: boolean): Promise<void> {
		BlockingUtils.unblockPlayer(this.player.discordUserId, BlockingConstants.REASONS.FIGHT);
		await this.manageMissionsOf(fightView);
		if (winner) {
			await MissionsController.update(this.player, fightView.channel, fightView.language, {
				missionId: "fightHealthPercent", params: {
					remainingPercent: this.stats.fightPoints / this.stats.maxFightPoint
				}
			});
			await MissionsController.update(this.player, fightView.channel, fightView.language, {
				missionId: "finishWithAttack",
				params: {
					lastAttack: this.fightActionsHistory.at(-1)
				}
			});
		}
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
	 * get the player level of the fighter
	 */
	public getPlayerLevel(): number {
		return this.player.level;
	}

	/**
	 * Send the choose action embed message
	 * @private
	 * @param fightView
	 */
	private async sendChooseActionEmbed(fightView: FightView): Promise<Message> {
		const chooseActionEmbed = new DraftBotEmbed();
		chooseActionEmbed.formatAuthor(fightView.fightTranslationModule.format("turnIndicationsTitle", {pseudo: this.getName()}), this.getUser());
		chooseActionEmbed.setDescription(fightView.fightTranslationModule.get("turnIndicationsDescription"));
		return await fightView.channel.send({embeds: [chooseActionEmbed]});
	}

	/**
	 * Get the selected action from the reaction
	 * @param reaction
	 * @private
	 */
	private getSelectedAction(reaction: Collection<Snowflake, MessageReaction>): FightAction {
		if (!reaction.first()) {
			return null;
		}
		const selectedActionEmoji = reaction.first().emoji.name;
		for (const [, action] of this.availableFightActions) {
			if (action.getEmoji() === selectedActionEmoji) {
				return action;
			}
		}
		return null; // impossible in theory
	}

	/**
	 * Send the embed to choose an action
	 * @param fightView
	 */
	chooseAction(fightView: FightView): void {
		const actions: Map<string, FightAction> = this.availableFightActions;
		this.sendChooseActionEmbed(fightView).then((chooseActionEmbedMessage) => {
			const collector = chooseActionEmbedMessage.createReactionCollector({
				filter: (reaction) => reaction.me && reaction.users.cache.last().id === this.getDiscordId(),
				time: FightConstants.TIME_FOR_ACTION_SELECTION,
				max: 1
			});
			collector.on("end", async (reaction) => {
				const selectedAction = this.getSelectedAction(reaction);
				await chooseActionEmbedMessage.delete();
				if (selectedAction === null) {
					// USER HASN'T SELECTED AN ACTION
					this.suicide();
					await fightView.fightController.endFight();
					return;
				}
				await fightView.fightController.executeFightAction(selectedAction, true);
			});
			const reactions = [];
			for (const [, action] of actions) {
				reactions.push(chooseActionEmbedMessage.react(action.getEmoji()));
			}

			Promise.all(reactions).catch(() => null);
		});
	}
}