import {
	DataTypes, QueryInterface
} from "sequelize";
import { FightConstants } from "../../../../../../Lib/src/constants/FightConstants";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export const leaguesAttributes008 = {
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
};

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "008-gloryandleague.js")) {
		return;
	}

	await context.addColumn("players", "gloryPoints", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: FightConstants.ELO.DEFAULT_ELO
	});
	await context.addColumn("players", "fightCountdown", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: FightConstants.DEFAULT_FIGHT_COUNTDOWN
	});
	await context.addColumn("players", "gloryPointsLastSeason", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0
	});
	await context.sequelize.query(`
		UPDATE players
		SET players.gloryPoints = ROUND(GREATEST(0, (players.level - 8) * 800 / 112))
	`);
	await context.sequelize.query(`
		UPDATE players
		SET players.fightCountdown = ${FightConstants.DEFAULT_FIGHT_COUNTDOWN}
	`);
	await context.sequelize.query(`
		UPDATE players
		SET players.gloryPointsLastSeason = 0
	`);

	// Add league table
	await context.createTable("leagues", leaguesAttributes008);

	// Removal of badge 🥚
	await context.sequelize.query(`
		UPDATE players
		SET players.badges = REPLACE(players.badges, "-🥚", "")
	`);
	await context.sequelize.query(`
		UPDATE players
		SET players.badges = REPLACE(players.badges, "🥚-", "")
	`);
	await context.sequelize.query(`
		UPDATE players
		SET players.badges = NULL
		WHERE players.badges = "🥚"
	`);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "gloryPoints");
	await context.removeColumn("players", "fightCountdown");
	await context.removeColumn("players", "gloryPointsLastSeason");
	await context.dropTable("leagues");
}
