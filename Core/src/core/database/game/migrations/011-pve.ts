import {
	DataTypes, QueryInterface
} from "sequelize";

export const monsterLocationsAttributes011 = {
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
};

export async function up({ context }: { context: QueryInterface }): Promise<void> {
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
		fightPointsRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		attackRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		defenseRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		speedRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		breath: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		maxBreath: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		breathRegen: {
			type: DataTypes.INTEGER,
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
	await context.createTable("monster_locations", monsterLocationsAttributes011);
	await context.addColumn("map_locations", "attribute", {
		type: DataTypes.TEXT,
		allowNull: false
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("monster_locations");
	await context.dropTable("monster_attacks");
	await context.dropTable("monsters");
	await context.removeColumn("map_locations", "attribute");
}
