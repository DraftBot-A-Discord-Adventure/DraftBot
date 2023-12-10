import {KeycloakConfig} from "./KeycloakConfig";
import {KeycloakUserToRegister} from "./KeycloakUserToRegister";
import {KeycloakUser} from "./KeycloakUser";

export class KeycloakUtils {
	private static keycloakToken: string | null = null;

	private static keycloakTokenExpirationDate: number | null = null;

	private static async checkAndQueryToken(keycloakConfig: KeycloakConfig): Promise<void> {
		if (this.keycloakToken === null || this.keycloakTokenExpirationDate! < Date.now()) {
			const res = await fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: new URLSearchParams({
					"client_id": keycloakConfig.clientId,
					"client_secret": keycloakConfig.clientSecret,
					"grant_type": "client_credentials"
				})
			});

			if (!res.ok) {
				throw new Error(`Keycloak login error: '${JSON.stringify(await res.json())}'`);
			}

			const obj = await res.json();
			this.keycloakToken = obj.access_token;
			this.keycloakTokenExpirationDate = Date.now() + obj.expires_in - Math.ceil(0.1 * obj.expires_in); // -10% of seconds to be sure that the token hasn't expired
		}
	}

	public static async getUserIdByUsername(keycloakConfig: KeycloakConfig, username: string): Promise<KeycloakUser | null> {
		await this.checkAndQueryToken(keycloakConfig);

		const res = await fetch(`${keycloakConfig.url}/admin/realms/${keycloakConfig.realm}/users?username=${username}`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.keycloakToken}`,
				"Content-Type": "application/json"
			}
		});

		if (!res.ok) {
			throw new Error(`Keycloak retrieve user with username '${username}' error: '${JSON.stringify(await res.json())}'`);
		}

		const obj = await res.json() as KeycloakUser[];

		if (obj.length === 0) {
			return null;
		}

		return obj[0];
	}

	public static async registerUser(keycloakConfig: KeycloakConfig, registerParams: KeycloakUserToRegister): Promise<KeycloakUser> {
		await this.checkAndQueryToken(keycloakConfig);

		// Populate attributes
		const attributes: { [key:string]: string[] } = {};
		attributes.language = [registerParams.language];
		if (registerParams.discordId) {
			attributes.discordId = [registerParams.discordId];
		}

		const res = await fetch(`${keycloakConfig.url}/admin/realms/${keycloakConfig.realm}/users`, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${this.keycloakToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				username: registerParams.username,
				attributes,
				enabled: true
			})
		});

		if (!res.ok) {
			throw new Error(`Keycloak create user with parameters '${registerParams}', error: '${JSON.stringify(await res.json())}'`);
		}

		return (await this.getUserIdByUsername(keycloakConfig, registerParams.username))!;
	}

	public static async getOrRegisterDiscordUser(keycloakConfig: KeycloakConfig, discordId: string, language: string): Promise<KeycloakUser> {
		await this.checkAndQueryToken(keycloakConfig);

		const res = await fetch(`${keycloakConfig.url}/admin/realms/${keycloakConfig.realm}/users?q=discordId:${discordId}`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.keycloakToken}`,
				"Content-Type": "application/json"
			}
		});

		if (!res.ok) {
			throw new Error(`Keycloak retrieve user with attribute 'discordId:${discordId}', error: '${JSON.stringify(await res.json())}'`);
		}

		const obj = await res.json();
		if (obj.length === 0) {
			return this.registerUser(keycloakConfig, { username: `discord$${discordId}`, discordId, language });
		}

		return obj[0] as KeycloakUser;
	}
}