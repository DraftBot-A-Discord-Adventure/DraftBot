import {DataTypes, Model, Sequelize} from "sequelize";
import {ItemCategory} from "../../../../../../Lib/src/constants/ItemConstants";
import moment = require("moment");

export class InventoryInfo extends Model {
	declare readonly playerId: number;

	declare lastDailyAt: Date;

	declare weaponSlots: number;

	declare armorSlots: number;

	declare potionSlots: number;

	declare objectSlots: number;

	declare updatedAt: Date;

	declare createdAt: Date;


	public slotLimitForCategory(category: ItemCategory): number {
		switch (category) {
		case ItemCategory.WEAPON:
			return this.weaponSlots;
		case ItemCategory.ARMOR:
			return this.armorSlots;
		case ItemCategory.POTION:
			return this.potionSlots;
		case ItemCategory.OBJECT:
			return this.objectSlots;
		default:
			return 0;
		}
	}

	public addSlotForCategory(category: ItemCategory): void {
		switch (category) {
		case ItemCategory.WEAPON:
			this.weaponSlots++;
			break;
		case ItemCategory.ARMOR:
			this.armorSlots++;
			break;
		case ItemCategory.POTION:
			this.potionSlots++;
			break;
		case ItemCategory.OBJECT:
			this.objectSlots++;
			break;
		default:
			break;
		}
	}

	public getLastDailyAtTimestamp(): number {
		return this.lastDailyAt ? this.lastDailyAt.valueOf() : 0;
	}

	public updateLastDailyAt(): void {
		this.lastDailyAt = moment().toDate();
	}
}

/**
 * This class is used to treat the inventory info of a player
 */
export class InventoryInfos {

	/**
	 * Get the inventory info of a player
	 * @param playerId
	 */
	public static async getOfPlayer(playerId: number): Promise<InventoryInfo> {
		return (await InventoryInfo.findOrCreate({
			where: {
				playerId
			}
		}))[0];
	}
}

export function initModel(sequelize: Sequelize): void {
	InventoryInfo.init({
		playerId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		lastDailyAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		weaponSlots: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		armorSlots: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		potionSlots: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		objectSlots: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "inventory_info",
		freezeTableName: true
	});

	InventoryInfo.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default InventoryInfo;