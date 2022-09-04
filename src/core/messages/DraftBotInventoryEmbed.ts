import {DraftBotReactionMessage} from "./DraftBotReactionMessage";
import {DraftBotReaction} from "./DraftBotReaction";
import {Constants} from "../Constants";
import {TranslationModule, Translations} from "../Translations";
import {EmbedField, User} from "discord.js";
import {format} from "../utils/StringFormatter";
import Player from "../database/game/models/Player";
import {GenericItemModel, MaxStatsValues} from "../database/game/models/GenericItemModel";

type Slots = {
	weapons: GenericItemModel[],
	armors: GenericItemModel[],
	potions: GenericItemModel[],
	objects: GenericItemModel[]
}

type UserInformation = {
	user: User,
	player: Player,
	pseudo: string
}

class DraftBotInventoryEmbed extends DraftBotReactionMessage {
	mainTitle: string;

	mainFields: EmbedField[];

	mainFooter: string;

	stockTitle: string;

	stockFields: EmbedField[];

	stockFooter: string;

	isMainState = true;

	constructor(
		userInformation: UserInformation,
		language: string,
		slots: Slots,
		maxStatsValue: MaxStatsValues
	) {
		super(
			[
				new DraftBotReaction(
					Constants.REACTIONS.INVENTORY_RESERVE,
					DraftBotInventoryEmbed.reactionCallback,
					DraftBotInventoryEmbed.reactionCallback
				)
			],
			[userInformation.user.id],
			null,
			0,
			false,
			0
		);
		const trInventory = Translations.getModule("commands.inventory", language);
		this.mainTitle = trInventory.format("title", {pseudo: userInformation.pseudo});
		this.mainFields = [
			slots.weapons.filter((item: { slot: number; }) => item.slot === 0)[0].toFieldObject(language, maxStatsValue),
			slots.armors.filter((item: { slot: number; }) => item.slot === 0)[0].toFieldObject(language, maxStatsValue),
			slots.potions.filter((item: { slot: number; }) => item.slot === 0)[0].toFieldObject(language, null),
			slots.objects.filter((item: { slot: number; }) => item.slot === 0)[0].toFieldObject(language, maxStatsValue)
		];
		this.mainFooter = trInventory.format("clickStock", {emote: Constants.REACTIONS.INVENTORY_RESERVE});
		this.stockTitle = trInventory.format("stockTitle", {pseudo: userInformation.pseudo});
		this.stockFooter = trInventory.format("clickMainInventory", {emote: Constants.REACTIONS.INVENTORY_RESERVE});
		this.stockFields = [
			this.createStockField(trInventory.get("weapons"), trInventory, slots.weapons, userInformation.player.InventoryInfo.weaponSlots),
			this.createStockField(trInventory.get("armors"), trInventory, slots.armors, userInformation.player.InventoryInfo.armorSlots),
			this.createStockField(trInventory.get("potions"), trInventory, slots.potions, userInformation.player.InventoryInfo.potionSlots),
			this.createStockField(trInventory.get("objects"), trInventory, slots.objects, userInformation.player.InventoryInfo.objectSlots)
		];
		this.setTitle(this.mainTitle);
		this.addFields(this.mainFields);
		this.setFooter({text: this.mainFooter});
	}

	/**
	 * Callback of when you switch from the main inventory to the reserve
	 * @param msg
	 */
	static async reactionCallback(this: void, msg: DraftBotReactionMessage): Promise<void> {
		const invMsg: DraftBotInventoryEmbed = msg as DraftBotInventoryEmbed;
		if (invMsg.isMainState) {
			invMsg.setTitle(invMsg.stockTitle);
			invMsg.data.fields = invMsg.stockFields;
			invMsg.setFooter({text: invMsg.stockFooter});
		}
		else {
			invMsg.setTitle(invMsg.mainTitle);
			invMsg.data.fields = invMsg.mainFields;
			invMsg.setFooter({text: invMsg.mainFooter});
		}
		invMsg.isMainState = !invMsg.isMainState;
		await msg.sentMessage.edit({embeds: [invMsg]});
	}

	/**
	 * Creates the field for the reserve for a given type of item
	 * @param title
	 * @param tr
	 * @param items
	 * @param slots
	 */
	createStockField(title: string, tr: TranslationModule, items: GenericItemModel[], slots: number): EmbedField {
		const formattedTitle = format(title, {
			count: items.length - 1,
			max: slots - 1
		});
		if (slots <= 1) {
			return {
				name: formattedTitle,
				value: tr.get("noSlot"),
				inline: false
			};
		}
		let value = "";
		for (let i = 1; i < slots; ++i) {
			const search = items.filter(item => item.slot === i);
			if (search.length === 0) {
				value += tr.get("emptySlot");
			}
			else {
				value += search[0].toFieldObject(tr.language, null).value;
			}
			value += "\n";
		}
		return {
			name: formattedTitle,
			value,
			inline: false
		};
	}
}

export class DraftBotInventoryEmbedBuilder {
	private readonly _user: User;

	private readonly _language: string;

	private readonly _player: Player;

	constructor(user: User, language: string, player: Player) {
		this._user = user;
		this._language = language;
		this._player = player;
	}

	/**
	 * Get all items from the player's inventory that are from a certain type
	 * @param slotType
	 */
	async getItemsOfSlotsType(slotType: number): Promise<GenericItemModel[]> {
		return await Promise.all(this._player.InventorySlots.filter(slot => slot.itemCategory === slotType).map(async function(item) {
			const newItem = await item.getItem();
			newItem.slot = item.slot;
			return newItem;
		}));
	}

	async build(): Promise<DraftBotInventoryEmbed> {
		return new DraftBotInventoryEmbed(
			{
				user: this._user,
				player: this._player,
				pseudo: await this._player.getPseudo(this._language)
			},
			this._language,
			{
				weapons: await this.getItemsOfSlotsType(Constants.ITEM_CATEGORIES.WEAPON),
				armors: await this.getItemsOfSlotsType(Constants.ITEM_CATEGORIES.ARMOR),
				potions: await this.getItemsOfSlotsType(Constants.ITEM_CATEGORIES.POTION),
				objects: await this.getItemsOfSlotsType(Constants.ITEM_CATEGORIES.OBJECT)
			},
			await this._player.getMaxStatsValue()
		);
	}
}