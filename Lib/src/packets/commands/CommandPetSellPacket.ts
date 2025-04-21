import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";
import { OwnedPet } from "../../types/OwnedPet";

@sendablePacket(PacketDirection.FRONT_TO_BACK)
export class CommandPetSellPacketReq extends DraftBotPacket {
	price!: number;

	askedPlayerKeycloakId?: string;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellNoPetErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellNotInGuildErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellFeistyErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellBadPriceErrorPacket extends DraftBotPacket {
	minPrice!: number;

	maxPrice!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellOnlyOwnerCanCancelErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellCancelPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellCantSellToYourselfErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellSameGuildError extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellAlreadyHavePetError extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellNotEnoughMoneyError extends DraftBotPacket {
	missingMoney!: number;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellInitiatorSituationChangedErrorPacket extends DraftBotPacket {}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellSuccessPacket extends DraftBotPacket {
	guildName!: string;

	xpEarned!: number;

	pet!: OwnedPet;

	isGuildMax!: boolean;
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandPetSellNoOneAvailableErrorPacket extends DraftBotPacket {}
