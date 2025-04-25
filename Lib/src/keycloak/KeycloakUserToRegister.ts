export interface KeycloakUserToRegister {
	keycloakUsername: string;
	gameUsername: string;
	language: string;
	password?: string;
	discordId?: string;
}
