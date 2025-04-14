import { QueryInterface } from "sequelize";

const badgeMappings = [
	{
		oldEmote: "🏆", newId: "top_v1_player"
	},
	{
		oldEmote: "🏅", newId: "top_10_v1"
	},
	{
		oldEmote: "👑", newId: "bot_owner"
	},
	{
		oldEmote: "⚙️", newId: "technical_team"
	},
	{
		oldEmote: "✨", newId: "top_glory"
	},
	{
		oldEmote: "❤️", newId: "support"
	},
	{
		oldEmote: "🍀", newId: "contest"
	},
	{
		oldEmote: "💸", newId: "donor"
	},
	{
		oldEmote: "🐞", newId: "major_bug_reporter"
	},
	{
		oldEmote: "🎰", newId: "random"
	},
	{
		oldEmote: "⛑️", newId: "first_20_members"
	},
	{
		oldEmote: "🥇", newId: "top_1_before_reset"
	},
	{
		oldEmote: "🤑", newId: "rich"
	},
	{
		oldEmote: "🌟", newId: "advertiser"
	},
	{
		oldEmote: "🖋️", newId: "redactor"
	},
	{
		oldEmote: "🌍", newId: "translator"
	},
	{
		oldEmote: "🎗️", newId: "top_week"
	},
	{
		oldEmote: "🎄", newId: "christmas"
	},
	{
		oldEmote: "😂", newId: "funny"
	},
	{
		oldEmote: "💎", newId: "powerful_guild"
	},
	{
		oldEmote: "🪩", newId: "very_powerful_guild"
	},
	{
		oldEmote: "⚔️", newId: "tournament_winner"
	},
	{
		oldEmote: "🔖", newId: "early_class_adopter"
	},
	{
		oldEmote: "💞", newId: "legendary_pet"
	},
	{
		oldEmote: "💍", newId: "mission_completer"
	},
	{
		oldEmote: "🕊️", newId: "good_bug_reporter"
	},
	{
		oldEmote: "🗳️", newId: "voter"
	}
];

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	const query = "UPDATE players SET badges = REPLACE(badges, :oldEmote, :newId)";

	for (const {
		oldEmote, newId
	} of badgeMappings) {
		await context.sequelize.query(query, {
			replacements: {
				oldEmote, newId
			}
		});
	}

	await context.sequelize.query("UPDATE players SET badges = REPLACE(badges, '-', ',')");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	const query = "UPDATE players SET badges = REPLACE(badges, :newId, :oldEmote)";

	for (const {
		oldEmote, newId
	} of badgeMappings) {
		await context.sequelize.query(query, {
			replacements: {
				oldEmote, newId
			}
		});
	}

	await context.sequelize.query("UPDATE players SET badges = REPLACE(badges, ',', '-')");
}
