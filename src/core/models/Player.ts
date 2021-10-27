import {
	Sequelize,
	Model,
	DataTypes, QueryTypes
} from "sequelize";
import InventorySlot from "./InventorySlot";
import PetEntity from "./PetEntity";
import PlayerSmallEvent from "./PlayerSmallEvent";
import MissionSlot from "./MissionSlot";
import PlayerMissionsInfo from "./PlayerMissionsInfo";
import InventoryInfo from "./InventoryInfo";

export class Player extends Model {
	public readonly entityId!: number;

	public level!: number;

	public class!: number;

	public money!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public InventorySlots: InventorySlot[];

	public InventoryInfo: InventoryInfo;

	public Pet: PetEntity;

	public PlayerSmallEvents: PlayerSmallEvent[];

	public MissionSlots: MissionSlot[];

	public MissionsInfo: PlayerMissionsInfo;
}

export class Players {
	static async getByRank(rank: number): Promise<Player[]> {
		const query = `SELECT *
                       FROM (SELECT entityId,
                                    RANK() OVER (ORDER BY score desc, level desc)       rank,
                                    RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                             FROM players)
                       WHERE rank = :rank`;
		return await Player.sequelize.query(query, {
			replacements: {
				rank: rank
			},
			type: QueryTypes.SELECT
		});
	}
}

export function initModel(sequelize: Sequelize) {
	Player.init({
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "players",
		freezeTableName: true
	});

	Player.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default Player;