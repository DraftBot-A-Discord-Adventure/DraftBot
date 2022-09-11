import {DataTypes, QueryInterface} from "sequelize";

const logsPlayersNumbersAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	value: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	reason: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};

const logsItemAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	itemId: {
		type: DataTypes.SMALLINT.UNSIGNED,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};

const logsShopLoggingAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	shopItem: {
		type: DataTypes.TINYINT,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.createTable("players", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordId: {
			type: DataTypes.STRING(20), // eslint-disable-line new-cap
			allowNull: false
		}
	});
	await context.createTable("players_money", logsPlayersNumbersAttributes);
	await context.createTable("players_health", logsPlayersNumbersAttributes);
	await context.createTable("players_experience", logsPlayersNumbersAttributes);
	await context.createTable("players_score", logsPlayersNumbersAttributes);
	await context.createTable("players_gems", logsPlayersNumbersAttributes);
	await context.createTable("players_level", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		level: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("commands", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		commandName: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("players_commands", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		serverId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		commandId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("servers", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordId: {
			type: DataTypes.STRING(20), // eslint-disable-line new-cap
			allowNull: false
		}
	});
	await context.createTable("small_events", {
		id: {
			type: DataTypes.TINYINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("players_small_events", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		smallEventId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_possibilities", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		possibilityId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("possibilities", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		bigEventId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		emote: {
			type: DataTypes.STRING(5), // eslint-disable-line new-cap
			allowNull: true // null for end
		},
		issueIndex: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
	await context.createTable("alterations", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		alteration: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("players_standard_alterations", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		alterationId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_occupied_alterations", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		duration: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("unlocks", {
		buyerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		releasedId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_class_changes", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		classId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_votes", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("servers_joins", {
		serverId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("servers_quits", {
		serverId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("map_links", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		start: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		end: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_travels", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		mapLinkId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("missions", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		variant: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		objective: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
	await context.createTable("missions_daily", {
		missionId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("missions_daily_finished", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("missions_failed", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		missionId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("missions_finished", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		missionId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("missions_found", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		missionId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("missions_campaign_progresses", {
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
	});
	await context.createTable("players_15_best_topweek", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		position: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		topWeekScore: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("items_gains_armor", logsItemAttributes);
	await context.createTable("items_gains_object", logsItemAttributes);
	await context.createTable("items_gains_potion", logsItemAttributes);
	await context.createTable("items_gains_weapon", logsItemAttributes);
	await context.createTable("items_sells_armor", logsItemAttributes);
	await context.createTable("items_sells_object", logsItemAttributes);
	await context.createTable("items_sells_potion", logsItemAttributes);
	await context.createTable("items_sells_weapon", logsItemAttributes);
	await context.createTable("players_timewarps", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		time: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("pet_entities", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		gameId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		creationTimestamp: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
	await context.createTable("pet_nicknames", {
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(16), // eslint-disable-line new-cap
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		gameId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		creationTimestamp: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("guilds_kicks", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		kickedPlayer: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("daily_potions", {
		potionId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("classical_shop_buyouts", logsShopLoggingAttributes);
	await context.createTable("guild_shop_buyouts", {
		...logsShopLoggingAttributes,
		amount: {
			type: DataTypes.TINYINT,
			allowNull: false
		}
	});
	await context.createTable("mission_shop_buyouts", logsShopLoggingAttributes);
	await context.createTable("daily_timeouts", {
		petLoveChange: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("top_week_ends", {
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_dailies", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reward: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("pets_transfers", {
		playerPetId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		guildPetId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_leaves", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		leftPlayer: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_destroys", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_elders_removes", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		removedElder: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_chiefs_changes", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		newChief: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("pets_frees", {
		petId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("fights_results", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		player1Id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		player1Points: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		player2Id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		player2Points: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		turn: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		winner: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		friendly: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("fights_actions", {
		id: {
			type: DataTypes.TINYINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("fights_actions_used", {
		fightId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		player: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		actionId: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		count: {
			type: DataTypes.TINYINT,
			allowNull: false
		}
	});
	await context.createTable("guilds_creations", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		creatorId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_joins", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		adderId: DataTypes.INTEGER,
		addedId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_experiences", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		experience: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_levels", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		level: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("pets_trades", {
		firstPetId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		secondPetId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_descriptions_changes", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		description: DataTypes.STRING,
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_elders_adds", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		addedElder: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("pet_sells", {
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		sellerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		buyerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		price: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("pets_loves_changes", {
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		lovePoints: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_foods_changes", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		food: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		total: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("guilds_new_pets", {
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_new_pets", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		petId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_dailies", logsItemAttributes);
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.dropTable("players");
	await context.dropTable("players_money");
	await context.dropTable("players_health");
	await context.dropTable("players_experience");
	await context.dropTable("players_score");
	await context.dropTable("players_gems");
	await context.dropTable("players_level");
	await context.dropTable("commands");
	await context.dropTable("players_commands");
	await context.dropTable("servers");
	await context.dropTable("small_events");
	await context.dropTable("players_small_events");
	await context.dropTable("players_possibilities");
	await context.dropTable("possibilities");
	await context.dropTable("alteration");
	await context.dropTable("players_standard_alteration");
	await context.dropTable("players_occupied_alteration");
	await context.dropTable("unlocks");
	await context.dropTable("players_class_changes");
	await context.dropTable("players_votes");
	await context.dropTable("servers_joins");
	await context.dropTable("servers_quits");
	await context.dropTable("map_links");
	await context.dropTable("players_travels");
	await context.dropTable("missions");
	await context.dropTable("missions_daily");
	await context.dropTable("missions_daily_finished");
	await context.dropTable("missions_failed");
	await context.dropTable("missions_finished");
	await context.dropTable("missions_found");
	await context.dropTable("missions_campaign_progresses");
	await context.dropTable("players_15_best_topweek");
	await context.dropTable("items_gains_armor");
	await context.dropTable("items_gains_object");
	await context.dropTable("items_gains_potion");
	await context.dropTable("items_gains_weapon");
	await context.dropTable("items_sells_armor");
	await context.dropTable("items_sells_object");
	await context.dropTable("items_sells_potion");
	await context.dropTable("items_sells_weapon");
	await context.dropTable("players_timewarps");
	await context.dropTable("pet_entities");
	await context.dropTable("pet_nicknames");
	await context.dropTable("guilds");
	await context.dropTable("guilds_kicks");
	await context.dropTable("daily_potions");
	await context.dropTable("classical_shop_buyouts");
	await context.dropTable("guild_shop_buyouts");
	await context.dropTable("mission_shop_buyouts");
	await context.dropTable("daily_timeouts");
	await context.dropTable("top_week_ends");
	await context.dropTable("guilds_dailies");
	await context.dropTable("pets_transfers");
	await context.dropTable("guilds_leaves");
	await context.dropTable("guilds_destroys");
	await context.dropTable("guilds_elders_removes");
	await context.dropTable("guilds_chiefs_changes");
	await context.dropTable("pets_frees");
	await context.dropTable("fights_results");
	await context.dropTable("fights_actions");
	await context.dropTable("fights_actions_used");
	await context.dropTable("guilds_creations");
	await context.dropTable("guilds_joins");
	await context.dropTable("guilds_experiences");
	await context.dropTable("guilds_levels");
	await context.dropTable("pets_trades");
	await context.dropTable("guilds_descriptions_changes");
	await context.dropTable("guilds_elders_adds");
	await context.dropTable("pets_loves_changes");
	await context.dropTable("guilds_foods_changes");
	await context.dropTable("guilds_new_pets");
	await context.dropTable("players_new_pets");
	await context.dropTable("players_dailies");
}