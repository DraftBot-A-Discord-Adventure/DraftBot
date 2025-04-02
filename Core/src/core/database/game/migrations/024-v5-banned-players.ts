import {
	DataTypes, Op, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "banned", {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false
	});

	await context.bulkUpdate("players", {
		banned: true
	}, {
		score: 0,
		effectEndDate: {
			[Op.gt]: new Date(2050, 0, 1)
		}
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "banned");
}
