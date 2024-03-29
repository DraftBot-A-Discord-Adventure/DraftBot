import {DataTypes, Model, Sequelize} from "sequelize";
import * as moment from "moment";
import Monster from "./Monster";
import MonsterAttack from "./MonsterAttack";
import {RandomUtils} from "../../../utils/RandomUtils";

export class MonsterLocation extends Model {
	declare readonly id: number;

	declare readonly monsterId: number;

	declare readonly mapId: number;

	declare updatedAt: Date;

	declare createdAt: Date;
}

export class MonsterLocations {
	static async getRandomMonster(mapId = -1, seed = RandomUtils.draftbotRandom.integer(1, 9999)): Promise<{ monster: Monster, attacks: MonsterAttack[] } | null> {
		const amountOfMonsterAvailable = await MonsterLocation.count(mapId === -1 ? {} : {
			where: {
				mapId
			}
		});
		const indexToGet = seed % amountOfMonsterAvailable;
		const randomLocs = await MonsterLocation.findAll(mapId === -1 ? {} : {
			where: {
				mapId
			}
		});
		const randomLoc = randomLocs[indexToGet];
		if (!randomLoc) {
			return null;
		}

		return {
			monster: await Monster.findOne({
				where: {
					id: randomLoc.monsterId
				}
			}),
			attacks: await MonsterAttack.findAll({
				where: {
					monsterId: randomLoc.monsterId
				}
			})
		};
	}
}

export function initModel(sequelize: Sequelize): void {
	MonsterLocation.init({
		monsterId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		mapId: {
			type: DataTypes.INTEGER,
			allowNull: false
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
		tableName: "monster_locations",
		freezeTableName: true
	}).removeAttribute("id");

	MonsterLocation.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default MonsterLocation;