import {
	DataTypes, QueryInterface
} from "sequelize";

// The server tournament mode was removed before release: its app notification setting goes with it.
export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("app_notification_preferences", "tournament");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("app_notification_preferences", "tournament", {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: true
	});
}
