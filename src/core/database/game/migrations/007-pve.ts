import {DataTypes, QueryInterface} from "sequelize";
import * as moment from "moment/moment";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.createTable("monsters", {
		id: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			primaryKey: true
		},
		fr: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		en: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		baseFightPoints: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		baseAttack: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		baseDefense: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		baseSpeed: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		rewardMultiplier: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		updatedAt: DataTypes.DATE,
		createdAt: DataTypes.DATE
	});
	await context.createTable("monster_attacks", {
		monsterId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		attackId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		minLevel: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		updatedAt: DataTypes.DATE,
		createdAt: DataTypes.DATE
	});
	await context.createTable("monster_locations", {
		monsterId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		mapId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		updatedAt: DataTypes.DATE,
		createdAt: DataTypes.DATE
	});
	await context.addColumn("map_locations", "attribute", {
		type: DataTypes.TEXT,
		allowNull: false
	});
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.dropTable("monster_locations");
	await context.dropTable("monster_attacks");
	await context.dropTable("monsters");
}