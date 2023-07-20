import {Fighter} from "./Fighter";
import Player, {Players} from "../../database/game/models/Player";
import Class from "../../database/game/models/Class";
import {Message, TextBasedChannel, User} from "discord.js";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {PlayerActiveObjects} from "../../database/game/models/PlayerActiveObjects";
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
import {NumberChangeReason} from "../../constants/LogsConstants";
import {FighterStatus} from "../FighterStatus";
import {TranslationModule} from "../../Translations";
import {Maps} from "../../maps/Maps";
import {RandomUtils} from "../../utils/RandomUtils";
import {PVEConstants} from "../../constants/PVEConstants";
import {LogsReadRequests} from "../../database/logs/LogsReadRequests";

/**
 * @class PlayerFighter
 * @extends Fighter
 * Class representing a player in a fight
 */
export class PlayerFighter extends Fighter {
	public player: Player;

	private readonly user: User;

	private class: Class;

	private glory: number;

	private pveMembers: { attack: number, speed: number }[];

	public constructor(user: User, player: Player, playerClass: Class) {
		super(player.level, FightActions.listFightActionsFromClass(playerClass));
		this.player = player;
		this.class = playerClass;
		this.user = user;
	}

	/**
	 * Get the pseudo
	 */
	getName(): string {
		return this.player.getPseudo(null);
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
	 * @param startStatus The first status of a player
	 */
	async startFight(fightView: FightView, startStatus: FighterStatus): Promise<void> {
		this.status = startStatus;
		await this.consumePotionIfNeeded(fightView.fightController.friendly, fightView.channel, fightView.language);
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
	 * Allow a fighter to unblock itself
	 * @public
	 */
	unblock(): void {
		BlockingUtils.unblockPlayer(this.player.discordUserId, BlockingConstants.REASONS.FIGHT);
	}

	/**
	 * the fighter loads its various stats
	 * @param friendly true if the fight is friendly
	 * @public
	 */
	public async loadStats(friendly: boolean): Promise<void> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(this.player.id);
		this.stats.fightPoints = friendly ? await this.player.getMaxCumulativeFightPoint() : await this.player.getCumulativeFightPoint();
		this.stats.maxFightPoint = await this.player.getMaxCumulativeFightPoint();
		this.stats.attack = await this.player.getCumulativeAttack(playerActiveObjects);
		this.stats.defense = await this.player.getCumulativeDefense(playerActiveObjects);
		this.stats.speed = await this.player.getCumulativeSpeed(playerActiveObjects);
		this.stats.breath = await this.player.getBaseBreath();
		this.stats.maxBreath = await this.player.getMaxBreath();
		this.stats.breathRegen = await this.player.getBreathRegen();
		this.glory = this.player.gloryPoints;
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
		await checkDrinkPotionMissions(channel, language, this.player, drankPotion, await InventorySlots.getOfPlayer(this.player.id));
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
	 * Send the embed to choose an action
	 * @param fightView
	 */
	async chooseAction(fightView: FightView): Promise<void> {
		const actions: Map<string, FightAction> = new Map(this.availableFightActions);

		// Add guild attack if on PVE island and members are here
		if (Maps.isOnPveIsland(this.player)) {
			if (!this.pveMembers) {
				const members = await LogsReadRequests.getGuildMembersThatWereOnPveIsland(this.player);
				this.pveMembers = [];
				for (const member of members) {
					const memberActiveObjects = await InventorySlots.getMainSlotsItems(member.id);
					this.pveMembers.push({
						attack: await member.getCumulativeAttack(memberActiveObjects),
						speed: await member.getCumulativeSpeed(memberActiveObjects)
					});
				}
			}

			if (this.pveMembers.length !== 0 && RandomUtils.draftbotRandom.realZeroToOneInclusive() < PVEConstants.GUILD_ATTACK_PROBABILITY) {
				actions.set("guildAttack", FightActions.getFightActionById("guildAttack"));
			}
		}

		this.sendChooseActionEmbed(fightView).then(this.chooseActionCallback(actions, fightView));
	}

	private chooseActionCallback(actions: Map<string, FightAction>, fightView: FightView): (m: Message) => void {
		return (chooseActionEmbedMessage: Message): void => {
			const collector = chooseActionEmbedMessage.createReactionCollector({
				filter: (reaction) => reaction.me && reaction.users.cache.last().id === this.getDiscordId(),
				time: FightConstants.TIME_FOR_ACTION_SELECTION,
				max: 1
			});
			collector.on("end", async (reaction) => {
				const emoji = reaction.first()?.emoji.name;
				const selectedAction = Array.from(actions.values()).find((action) => emoji && action.getEmoji() === emoji);
				try {
					await chooseActionEmbedMessage.delete();
					if (!selectedAction) {
						// USER HASN'T SELECTED AN ACTION
						this.kill();
						await fightView.fightController.endFight();
						return;
					}
					await fightView.fightController.executeFightAction(selectedAction, true);
				}
				catch (e) {
					console.log("### FIGHT MESSAGE DELETED OR LOST : actionMessage ###");
					fightView.fightController.endBugFight();
				}
			});
			const reactions = [];
			for (const [, action] of actions) {
				reactions.push(chooseActionEmbedMessage.react(action.getEmoji()));
			}

			Promise.all(reactions).catch(() => null);
		};
	}

	/**
	 * Return a display of the player in a string format
	 * @param fightTranslationModule
	 */
	public getStringDisplay(fightTranslationModule: TranslationModule): string {
		return fightTranslationModule.format(
			this.status.getTranslationField(),
			{
				pseudo: this.getName()
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
	}

	/**
	 * Get the members of the guild of the player on the island of the fighter
	 */
	public getPveMembersOnIsland(): { attack: number, speed: number }[] {
		return this.pveMembers;
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
		if (!fightView.fightController.friendly) {
			const [newPlayer] = await Players.getOrRegister(this.player.discordUserId);
			newPlayer.setFightPointsLost(this.stats.maxFightPoint - this.stats.fightPoints, NumberChangeReason.FIGHT);
			await newPlayer.save();
		}

		await this.checkFightActionHistory(fightView);

		await MissionsController.update(this.player, fightView.channel, fightView.language, {missionId: "anyFight"});

		const slots = await MissionSlots.getOfPlayer(this.player.id);
		for (const slot of slots) {
			if (slot.missionId === "fightStreak") {
				const lastDay = slot.saveBlob ? slot.saveBlob.readInt32LE() : 0;
				const currDay = getDayNumber();
				if (lastDay === currDay - 1) {
					await MissionsController.update(this.player, fightView.channel, fightView.language, {missionId: "fightStreak"});
				}
				else if (lastDay !== currDay) {
					await MissionsController.update(this.player, fightView.channel, fightView.language, {
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
	private async sendChooseActionEmbed(fightView: FightView): Promise<Message> {
		const chooseActionEmbed = new DraftBotEmbed();
		chooseActionEmbed.formatAuthor(fightView.fightTranslationModule.format("turnIndicationsTitle", {pseudo: this.getName()}), this.getUser());
		chooseActionEmbed.setDescription(fightView.fightTranslationModule.get("turnIndicationsDescription"));
		return await fightView.channel.send({embeds: [chooseActionEmbed]});
	}
}