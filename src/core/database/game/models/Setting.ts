import {DataTypes, Model, Sequelize} from "sequelize";
import moment = require("moment");
import {Potions} from "./Potion";
import {MapCache} from "../../../maps/MapCache";

class SettingClass<T extends number | string> {
	private readonly name: string;

	private readonly defaultValue: () => Promise<T>;

	private cachedValue: T;

	constructor(name: string, defaultValue: () => Promise<T>) {
		this.name = name;
		this.defaultValue = defaultValue;
		this.cachedValue = null;
	}

	public async getValue(): Promise<T> {
		if (this.cachedValue === null) {
			const settingInstance = await Setting.findOne({
				where: {
					name: this.name
				}
			});

			if (settingInstance) {
				let value: T;
				if (typeof this.cachedValue === "string") {
					value = <T>settingInstance.dataString;
				}
				else {
					value = <T>settingInstance.dataNumber;
				}
				this.cachedValue = value;
			}
			else {
				this.cachedValue = await this.defaultValue();
				if (typeof this.cachedValue === "string") {
					await Setting.create({
						name: this.name,
						dataString: this.cachedValue
					});
				}
				else {
					await Setting.create({
						name: this.name,
						dataNumber: this.cachedValue
					});
				}
			}
		}

		return this.cachedValue;
	}

	public async setValue(value: T): Promise<void> {
		if (typeof this.cachedValue === "string") {
			await Setting.update({
				dataString: value
			}, {
				where: {
					name: this.name
				}
			});
		}
		else {
			await Setting.update({
				dataNumber: value
			}, {
				where: {
					name: this.name
				}
			});
		}

		this.cachedValue = value;
	}
}

export class Setting extends Model {
	public name!: string;

	public dataString?: string;

	public dataNumber?: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Settings {
	public static readonly SHOP_POTION: SettingClass<number> = new SettingClass(
		"shopPotion",
		async (): Promise<number> => (await Potions.randomShopPotion()).id
	);

	public static readonly PVE_ISLAND: SettingClass<number> = new SettingClass(
		"pveIslandLink",
		(): Promise<number> => Promise.resolve(MapCache.randomPveBoatLinkId())
	);
}

export function initModel(sequelize: Sequelize): void {
	Setting.init({
		name: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		dataString: {
			type: DataTypes.STRING,
			allowNull: true
		},
		dataNumber: {
			type: DataTypes.INTEGER,
			allowNull: true
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
		tableName: "settings",
		freezeTableName: true
	});

	Setting.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Setting;