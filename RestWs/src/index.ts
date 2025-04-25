import {
	loadConfig, RestWsConfig
} from "./config/RestWsConfig";
import { DraftBotLogger } from "../../Lib/src/logs/DraftBotLogger";
import "source-map-support/register";
import { KeycloakConfig } from "../../Lib/src/keycloak/KeycloakConfig";
import { RestApi } from "./services/RestApi";

export let restWsConfig: RestWsConfig;
export let keycloakConfig: KeycloakConfig;

function main(): void {
	// Load the configuration
	restWsConfig = loadConfig();
	keycloakConfig = {
		realm: restWsConfig.KEYCLOAK_REALM,
		url: restWsConfig.KEYCLOAK_URL,
		clientId: restWsConfig.KEYCLOAK_CLIENT_ID,
		clientSecret: restWsConfig.KEYCLOAK_CLIENT_SECRET
	};

	// Initialize the logger
	DraftBotLogger.init(restWsConfig.LOGGER_LEVEL, restWsConfig.LOGGER_LOCATIONS, { app: "RestWs" }, restWsConfig.LOKI_HOST
		? {
			host: restWsConfig.LOKI_HOST,
			username: restWsConfig.LOKI_USERNAME,
			password: restWsConfig.LOKI_PASSWORD
		}
		: undefined);

	// Initialize and start the Rest API server
	new RestApi({
		allowNewUsersRegistering: restWsConfig.REST_API_ALLOW_NEW_USERS_REGISTERING,
		discordSso: restWsConfig.REST_API_DISCORD_SSO,
		betaLogin: restWsConfig.REST_API_BETA_LOGIN
	}).start(restWsConfig.REST_API_PORT);

	// Log the version of the application
	DraftBotLogger.info(`DraftBot RestWs ${process.env.npm_package_version}`);
}

main();
