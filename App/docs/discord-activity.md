# Running the app as a Discord Activity

A [Discord Activity](https://docs.discord.com/developers/activities/overview) is a web page Discord shows in an
iframe, launched from a voice channel, a text channel or a DM, on desktop and on mobile. The Activity is the
**web build of this app**: the same screens, the same packets, the same session as the phone. Only what
cannot work inside Discord's frame changes.

## How it works

```
Discord client ──iframe──▶ https://<client id>.discordsays.com/…  (Discord proxy, URL mappings)
                               │  /      → the static web export
                               │  /api   → RestWs REST API
                               │  /ws    → RestWs WebSocket
                               │  /cdn   → cdn.jsdelivr.net (emoji pictures)
```

- **Launch.** Discord adds `frame_id`, `instance_id` and `platform` to the page address.
  `captureDiscordLaunch()` (`src/activity/DiscordLaunch.web.ts`) reads them before the router's first
  navigation and starts the Embedded App SDK. Native builds load `DiscordLaunch.ts`, which never loads
  the SDK.
- **Addresses.** An Activity may only call its own origin. `src/activity/ActivityRoutes.ts` builds the
  REST, WebSocket and emoji addresses from the page origin, and Discord's proxy forwards each prefix to
  the host declared in the URL mappings.
- **Sign-in.** No Keycloak page can be shown in the frame. `signInThroughDiscord()` asks Discord for an
  authorization code (`identify email`, the scopes of the realm's `discord` provider), and RestWs turns it into a
  session through `POST /discord-activity/session`:
  1. RestWs exchanges the code for a Discord access token with the application's secret;
  2. RestWs asks Keycloak for an **external-to-internal token exchange** of that token
     (`subject_issuer=discord`, `audience=crownicles-app`, `scope=openid`);
  3. Keycloak validates the token by reading the Discord profile, finds the game account through its Discord
     link, exactly as a browser sign-in does, and opens a session.

  That session is issued to the `restWs` client, so the app refreshes it through
  `POST /discord-activity/refresh`. Past the first launch, Discord asks nothing: the game opens directly.
- **Refused accounts.** Keycloak refuses to open a session for a Discord account whose game account
  exists without a link to it (a legacy `discord-<id>` account). The player is told to sign in once with
  Discord from the app. `keycloak/scripts/linkLegacyDiscordAccounts.mjs` links those accounts in bulk.
- **What changes inside Discord.** External pages open through `openExternalLink`, which lets Discord
  ask the player first. The account section keeps only the deletion: the address, the password and the
  account itself are managed from the app.

## Server setup

### Keycloak

The exchange only exists in Keycloak's legacy token exchange, and Keycloak's generic *OAuth v2* provider
refuses it. The Crownicles extension (`keycloak/extensions/account-policy`) overrides that provider with
the same one able to validate a Discord token: rebuild the image.

1. Start Keycloak with `--features=token-exchange,admin-fine-grained-authz:v1`.
2. Grant the exchange permissions to RestWs (read-only without `--apply`):

   ```bash
   KEYCLOAK_URL=http://127.0.0.1:8080 KEYCLOAK_REALM=Crownicles \
   KEYCLOAK_ADMIN_USERNAME=admin KEYCLOAK_ADMIN_PASSWORD=admin \
   node keycloak/scripts/discordActivityTokenExchange.mjs --apply
   ```

### RestWs

Fill the `[discordActivity]` section of `RestWs/config/config.toml` with the Discord application of the
realm's `discord` identity provider (client id and secret from *OAuth2* in the Developer Portal). An empty
client id answers `404` on the Activity routes.

### The web build

```bash
cd App
EXPO_PUBLIC_DISCORD_CLIENT_ID=<client id> npx expo export --platform web --output-dir dist-activity
```

The other `EXPO_PUBLIC_*` values are not used inside Discord.

## Developer Portal

In the Discord application (the bot's application, so that the Activity uses the same accounts):

1. **Activities → Settings**: enable Activities, then tick the supported platforms (Web, Desktop, iOS,
   Android). An unticked platform does not show the Activity.
2. **Activities → URL Mappings**:

   | Prefix | Target |
   | --- | --- |
   | `/api` | RestWs REST host, e.g. `api.crownicles.com` |
   | `/ws` | RestWs WebSocket host |
   | `/cdn` | `cdn.jsdelivr.net` |
   | `/` | host serving `dist-activity` |

   Targets are written without the protocol. A longer prefix must come before a shorter one.
3. Enabling Activities creates a **Launch** Entry Point command. The bot sends it back with its global
   commands at each start, since Discord refuses a bulk overwrite that leaves it out.

Until the application is verified, an Activity only launches in servers with fewer than 25 members, for
the members of the developer team and the *App Testers*.

## Developing locally

`scripts/activity-proxy.mjs` serves the export and forwards the Activity routes, so a single tunnel is
enough and the single `/` mapping points at it:

```bash
cd App
node scripts/activity-proxy.mjs                 # http://localhost:10510, routes to the local services
cloudflared tunnel --url http://localhost:10510 # then map "/" to the tunnel host in the portal
```

`--route /prefix=http://host:port` replaces the target of a route, `--static <dir>` the served folder.
Then, in Discord, turn on *Developer Mode* (*Settings → Advanced* on desktop, *Appearance* on mobile),
join a voice channel and open the Activities (rocket) shelf. The SDK forwards the Activity's console
logs to the Discord client.
