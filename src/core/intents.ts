import {IntentsBitField} from "discord.js";

export abstract class Intents {
	static readonly LIST =
		[
			IntentsBitField.Flags.Guilds, // We need it for roles
			IntentsBitField.Flags.GuildMembers, // For tops
			// IntentsBitField.Flags.GuildBans, // We do not need to ban anyone
			// IntentsBitField.Flags.GuildEmojisAndStickers, // We do not need to manage emojis nor stickers
			// IntentsBitField.Flags.GuildIntegrations, // we do not need to manage integrations
			// IntentsBitField.Flags.GuildWebhooks, // We do not need webhook
			// IntentsBitField.Flags.GuildInvites, // We do not need to manage guild invites
			// IntentsBitField.Flags.GuildVoiceStates, // We do not need to manage voice channels
			// IntentsBitField.Flags.GuildPresences, // We do not need to manage presences
			IntentsBitField.Flags.GuildMessages, // We need to receive, send, update and delete messages
			IntentsBitField.Flags.GuildMessageReactions, // We need to add reactions
			// IntentsBitField.Flags.GuildMessageTyping, // We do not need to see who's typing
			IntentsBitField.Flags.DirectMessages, // We need to send and receive direct messages
			IntentsBitField.Flags.DirectMessageReactions // We need to receive direct messages reaction
			// IntentsBitField.Flags.DirectMessageTyping, // We do not need to see who is currently writing to the bots dms
			// IntentsBitField.Flags.MessageContent, // We do not need to manage other's message content
			// IntentsBitField.Flags.GuildScheduledEvents // We do not need to see a guild's events
		];
}