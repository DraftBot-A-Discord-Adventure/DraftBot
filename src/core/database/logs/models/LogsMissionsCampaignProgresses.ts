import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsMissionsCampaignProgresses extends Model {
	public readonly playerId!: number;

	public readonly number!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsMissionsCampaignProgresses.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		number: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "missions_campaign_progresses",
		freezeTableName: true,
		timestamps: false
	});

	LogsMissionsCampaignProgresses.removeAttribute("id");
}