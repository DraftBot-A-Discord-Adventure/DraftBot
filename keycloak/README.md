# Keycloak

Keycloak is the project used to authenticate users on DraftBot

## Start with docker

See [docker-compose.yml](./docker-compose.yml) as an example

## Configuring a realm

On http://127.0.0.1:8080/admin/master/console/:

First create a realm with the name you want:

![create-realm.png](images/create-realm.png)

Import the already configured realm [realm.json](realm.json):

![import-realm.png](images/import-realm.png)

Configure your Discord config.toml:

![discord-config.png](images/discord-config.png)