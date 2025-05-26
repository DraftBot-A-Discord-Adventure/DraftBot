import {
	DataTypes, Model, Sequelize
} from "sequelize";
import Player from "./Player";

export class DwarfPetsSeen extends Model {
	declare readonly playerId: number;

	declare readonly petTypeId: number;

	static async isPetSeen(player: Player, petTypeId: number): Promise<boolean> {
		const count = await DwarfPetsSeen.count({
			where: {
				playerId: player.id,
				petTypeId
			}
		});
		return count > 0;
	}

	static async markPetAsSeen(player: Player, petTypeId: number): Promise<void> {
		await DwarfPetsSeen.create({
			playerId: player.id,
			petTypeId
		});
	}
}


export function initModel(sequelize: Sequelize): void {
	DwarfPetsSeen.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		petTypeId: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "dwarf_pets_seen",
		freezeTableName: true
	});
}


