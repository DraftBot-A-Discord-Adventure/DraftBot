import {Message} from "discord.js";
import Entity from "../models/Entity";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";

export interface SmallEvent {
	executeSmallEvent: (message: Message, language: string, entity: Entity, seEmbed: DraftBotEmbed) => Promise<void>;

	canBeExecuted: (entity: Entity) => Promise<boolean>;
}