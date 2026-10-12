# Keycloak with the extensions the realm relies on, built once instead of copied by hand.
FROM quay.io/keycloak/keycloak:26.7.4

# Sign-in and sign-up by emailed link (Phase Two, Elastic License 2.0): the browser and
# registration flows of realm.json use its "magic-link-continuation-form" authenticator.
ADD --chown=keycloak:keycloak --checksum=sha256:a0f69b16de8fd5bc2d720ecddec4d5fcb3d895d890e3cfa59895d7b4fedff0d8 \
	https://repo1.maven.org/maven2/io/phasetwo/keycloak/keycloak-magic-link/0.90/keycloak-magic-link-0.90.jar \
	/opt/keycloak/providers/keycloak-magic-link.jar
