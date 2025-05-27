import {
	DataTypes, Model, Sequelize
} from "sequelize";
import Player from "./Player";
import { PetDataController } from "../../../../data/Pet";

export class DwarfPetsSeen extends Model {
	declare readonly playerId: number;

	declare readonly petTypeId: number;

	/**
	 * Return true if the player has already shown this pet
	 * @param player
	 * @param petTypeId
	 */
	static async isPetSeen(player: Player, petTypeId: number): Promise<boolean> {
		const count = await DwarfPetsSeen.count({
			where: {
				playerId: player.id,
				petTypeId
			}
		});
		return count > 0;
	}

	/**
	 * Save that the player shows to the dwarf the pet
	 * @param player
	 * @param petTypeId
	 */
	static async markPetAsSeen(player: Player, petTypeId: number): Promise<void> {
		await DwarfPetsSeen.create({
			playerId: player.id,
			petTypeId
		});
	}

	/**
	 * Return true if the player has shown every pet
	 * @param player
	 */
	static async isAllPetSeen(player: Player): Promise<boolean> {
		const petsSeen = await DwarfPetsSeen.count({
			where: {
				playerId: player.id
			}
		});

		return petsSeen === PetDataController.instance.getPetsCount();
	}
}


export function initModel(sequelize: Sequelize): void {
	DwarfPetsSeen.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		petTypeId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		}
	}, {
		sequelize,
		tableName: "dwarf_pets_seen",
		freezeTableName: true,
		timestamps: false
	});
}
