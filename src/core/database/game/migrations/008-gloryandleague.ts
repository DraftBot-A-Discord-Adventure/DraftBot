import {DataTypes, QueryInterface} from "sequelize";
import {FightConstants} from "../../../constants/FightConstants";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "gloryPoints", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: FightConstants.ELO.DEFAULT_ELO
	});
	await context.sequelize.query(`
		UPDATE players
		SET players.gloryPoints = ${FightConstants.ELO.DEFAULT_ELO}
	`);

	// add league table
	await context.createTable("leagues", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		color: {
			type: DataTypes.STRING,
			allowNull: false
		},
		minGloryPoints: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		maxGloryPoints: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		emoji: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		fr: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		en: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		updatedAt: DataTypes.DATE,
		createdAt: DataTypes.DATE
	});
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "gloryPoints");
	await context.dropTable("leagues");
}