package com.crownicles.keycloak;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.keycloak.Config;
import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormActionFactory;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;

public final class RegistrationPolicy implements FormAction, FormActionFactory {
    private static final String ID = "crownicles-registration-policy";
    private static final String USERNAME = "username";
    private static final String PREFIXES = "forbiddenPrefixes";
    private static final String NAMES = "reservedNames";

    public void validate(ValidationContext context) {
        var data = context.getHttpRequest().getDecodedFormParameters();
        String username = data.getFirst(USERNAME);
        var config = context.getAuthenticatorConfig().getConfig();
        String normalized = username == null ? "" : username.toLowerCase(Locale.ROOT);
        boolean reserved = Arrays.stream(config.getOrDefault(PREFIXES, "").split(",")).filter(value -> !value.isBlank()).anyMatch(normalized::startsWith)
            || Arrays.stream(config.getOrDefault(NAMES, "").split(",")).anyMatch(normalized::equals);
        if (reserved) {
            context.validationError(data, List.of(new FormMessage(USERNAME, "crowniclesReservedUsername")));
            return;
        }
        context.success();
    }
    public void success(FormContext context) {
        String username = context.getHttpRequest().getDecodedFormParameters().getFirst(USERNAME);
        context.getUser().setSingleAttribute("gameUsername", username);
        context.getUser().setSingleAttribute("registrationPending", "true");
    }
    public void buildPage(FormContext context, LoginFormsProvider form) {}
    public boolean requiresUser() { return false; }
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) { return true; }
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {}
    public FormAction create(KeycloakSession session) { return this; }
    public String getId() { return ID; }
    public String getDisplayType() { return "Crownicles registration policy"; }
    public String getReferenceCategory() { return ID; }
    public String getHelpText() { return "Rejects reserved names before user creation and initializes the game name."; }
    public boolean isConfigurable() { return true; }
    public boolean isUserSetupAllowed() { return false; }
    public AuthenticationExecutionModel.Requirement[] getRequirementChoices() { return new AuthenticationExecutionModel.Requirement[] {AuthenticationExecutionModel.Requirement.REQUIRED, AuthenticationExecutionModel.Requirement.DISABLED}; }
    public List<ProviderConfigProperty> getConfigProperties() { return List.of(new ProviderConfigProperty(PREFIXES, "Forbidden prefixes", "Comma-separated username prefixes", ProviderConfigProperty.STRING_TYPE, "discord-"), new ProviderConfigProperty(NAMES, "Reserved names", "Comma-separated reserved usernames", ProviderConfigProperty.STRING_TYPE, "")); }
    public void init(Config.Scope config) {}
    public void postInit(KeycloakSessionFactory factory) {}
    public void close() {}
}