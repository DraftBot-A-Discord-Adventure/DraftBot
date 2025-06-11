import fastify, {
	FastifyInstance, FastifyRequest
} from "fastify";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";
import { setupRegisterRoute } from "./routes/RegisterRoute";
import { setupLoginRoute } from "./routes/LoginRoute";
import { setupRefreshTokenRoute } from "./routes/RefreshTokenRoute";
import { DiscordSsoConfig } from "../config/DiscordSsoConfig";
import { setupDiscordRoutes } from "./routes/DiscordRoutes";

// todo add anti spam mechanism and registering with a captcha

/**
 * Returns the metadata for logging requests.
 * @param req
 */
export function getRequestLoggerMetadata(req: FastifyRequest): {
	req: {
		remoteAddress: string;
		method: string;
		url: string;
		headers: NodeJS.Dict<string | string[]>;
		query?: unknown;
	};
} {
	return {
		req: {
			remoteAddress: req.ip,
			method: req.method,
			url: req.url,
			headers: req.headers,
			query: req.query
		}
	};
}

/**
 * RestApi server class.
 */
export class RestApi {
	/**
	 * Fastify instance for the server.
	 */
	private readonly server: FastifyInstance;

	/**
	 * Flag to allow new users to register.
	 */
	private readonly allowNewUsersRegistering: boolean;

	/**
	 * Discord SSO configuration.
	 */
	private readonly discordSso?: DiscordSsoConfig;

	/**
	 * Flag to enable beta login.
	 */
	private readonly betaLogin: boolean;

	/**
	 * Constructor for the RestApi class.
	 * @param options
	 */
	constructor(options: {
		allowNewUsersRegistering: boolean;
		discordSso?: DiscordSsoConfig;
		betaLogin: boolean;
	}) {
		this.server = fastify();
		this.allowNewUsersRegistering = options.allowNewUsersRegistering;
		this.discordSso = options.discordSso;
		this.betaLogin = options.betaLogin;

		this.setupRoutes();
	}

	/**
	 * Sets up the routes for the API.
	 */
	private setupRoutes(): void {
		setupRegisterRoute(this.server, this.allowNewUsersRegistering);
		setupLoginRoute(this.server, this.betaLogin);
		setupRefreshTokenRoute(this.server);

		if (this.discordSso) {
			setupDiscordRoutes(this.server, this.discordSso, this.betaLogin);
		}
	}

	/**
	 * Starts the server on the specified port.
	 * @param port
	 */
	public start(port: number): void {
		this.server.listen({ port }, (err, address) => {
			if (err) {
				CrowniclesLogger.errorWithObj("Failed to start Rest API", err);
				process.exit(1);
			}
			CrowniclesLogger.info("Rest API is running", {
				address
			});
		});
	}
}
