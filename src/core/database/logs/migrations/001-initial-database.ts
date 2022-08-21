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
		petId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		isFemale: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
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
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		chiefId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
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
}

export async function down(context: QueryInterface): Promise<void> {
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
}