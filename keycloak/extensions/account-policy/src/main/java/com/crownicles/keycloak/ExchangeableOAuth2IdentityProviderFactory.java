package com.crownicles.keycloak;

import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import org.keycloak.OAuth2Constants;
import org.keycloak.OAuthErrorException;
import org.keycloak.broker.oauth.OAuth2IdentityProvider;
import org.keycloak.broker.oauth.OAuth2IdentityProviderFactory;
import org.keycloak.broker.oidc.OAuth2IdentityProviderConfig;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.broker.provider.IdentityBrokerException;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.events.EventBuilder;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.ErrorResponseException;

/**
 * Keycloak's generic "OAuth v2" provider, able to take part in an external-to-internal token exchange.
 *
 * <p>The Discord Activity signs the player in inside Discord, which hands RestWs a Discord access token, not a
 * Keycloak session. RestWs exchanges it for one of the app's sessions, and Keycloak only accepts a provider
 * whose tokens it knows how to validate: the built-in generic provider declares it cannot, although it has
 * everything needed. Validating the token is reading the profile behind it, exactly as a browser sign-in
 * does, so the player is matched to the same account, by the same mappers.</p>
 *
 * <p>Registered under the built-in id with a higher order, so the realm's {@code discord} provider keeps its
 * type and its linked accounts; only the exchange is added, the browser sign-in is untouched.</p>
 */
public final class ExchangeableOAuth2IdentityProviderFactory extends OAuth2IdentityProviderFactory {

	/** Above the built-in factory, which keeps the default order of 0. */
	private static final int OVERRIDE_ORDER = 1;

	@Override
	public int order() {
		return OVERRIDE_ORDER;
	}

	@Override
	public OAuth2IdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
		return new ExchangeableOAuth2IdentityProvider(session, super.create(session, model).getConfig());
	}

	static final class ExchangeableOAuth2IdentityProvider extends OAuth2IdentityProvider {

		ExchangeableOAuth2IdentityProvider(KeycloakSession session, OAuth2IdentityProviderConfig config) {
			super(session, config);
		}

		@Override
		protected boolean supportsExternalExchange() {
			return true;
		}

		@Override
		protected BrokeredIdentityContext exchangeExternalImpl(EventBuilder event, MultivaluedMap<String, String> params) {
			String subjectToken = params.getFirst(OAuth2Constants.SUBJECT_TOKEN);
			String subjectTokenType = params.getFirst(OAuth2Constants.SUBJECT_TOKEN_TYPE);
			if (subjectToken == null || subjectTokenType != null && !OAuth2Constants.ACCESS_TOKEN_TYPE.equals(subjectTokenType)) {
				throw invalidToken(event, "subject token missing or not an access token");
			}
			BrokeredIdentityContext identity;
			try {
				identity = doGetFederatedIdentity(subjectToken);
			}
			catch (IdentityBrokerException e) {
				throw invalidToken(event, "user info call failure");
			}
			if (identity.getId() == null) {
				throw invalidToken(event, "user info without identifier");
			}
			return identity;
		}

		private static ErrorResponseException invalidToken(EventBuilder event, String reason) {
			event.detail(Details.REASON, reason);
			event.error(Errors.INVALID_TOKEN);
			return new ErrorResponseException(OAuthErrorException.INVALID_TOKEN, "invalid token", Response.Status.BAD_REQUEST);
		}
	}
}
