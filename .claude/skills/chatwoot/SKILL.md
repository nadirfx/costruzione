---
name: chatwoot
description: Install and use Chatwoot (github.com/chatwoot/chatwoot), the open-source customer support inbox for website live chat, WhatsApp, Instagram, Facebook, email and more, through its REST API. Use when the user wants a shared inbox for customer messages, a chat widget on their website, to read or reply to customer conversations, manage contacts, labels, or canned responses.
---

# Chatwoot

Open-source, self-hosted customer support platform (alternative to Intercom/Zendesk):
one inbox for website live chat, WhatsApp, Instagram, Facebook, Telegram, email, SMS.
Upstream: https://github.com/chatwoot/chatwoot — Docs: https://www.chatwoot.com/docs

## Costs (tell the user)
- Self-hosted Community edition: **free** (MIT, except the `enterprise/` folder).
- Chatwoot Cloud: paid plans.
- **Captain** (their AI agent) and other enterprise features need a paid plan/license.
- Channels can have their own costs (e.g. WhatsApp Business API is billed by Meta).
- A laptop install is only reachable while the Mac is on; to receive real customer
  messages 24/7 it needs a server (a small VPS, paid). Say this before promising a live setup.

## Run locally on the Mac (Docker)

Needs Docker Desktop (`brew install --cask docker`).

```bash
mkdir -p ~/chatwoot && cd ~/chatwoot
curl -fsSL -o .env https://raw.githubusercontent.com/chatwoot/chatwoot/develop/.env.example
curl -fsSL -o docker-compose.yaml https://raw.githubusercontent.com/chatwoot/chatwoot/develop/docker-compose.production.yaml
```

Edit `.env` (never commit or print these):
- `SECRET_KEY_BASE` = output of `openssl rand -hex 64`
- `POSTGRES_PASSWORD` and `REDIS_PASSWORD` = strong random values; put the same
  `POSTGRES_PASSWORD` in `docker-compose.yaml` under the postgres service.
- `FRONTEND_URL=http://localhost:3000`

```bash
docker compose run --rm rails bundle exec rails db:chatwoot_prepare
docker compose up -d
```

Open http://localhost:3000 and create the admin account. Ports are bound to 127.0.0.1 only.
Stop with `docker compose down` (data stays in Docker volumes).

## API

- User access token: profile → **Profile settings → Access Token**. Keep it in an env var
  (e.g. `CHATWOOT_TOKEN`), never print or commit it. Header: `api_access_token: <token>`.
- Base: `http://localhost:3000/api/v1/accounts/<account_id>/...` (account id is in the dashboard URL).

```bash
CW=http://localhost:3000/api/v1/accounts/$ACCOUNT_ID
curl -sS -H "api_access_token: $CHATWOOT_TOKEN" "$CW/conversations?status=open"
curl -sS -H "api_access_token: $CHATWOOT_TOKEN" "$CW/conversations/<id>/messages"
curl -sS -H "api_access_token: $CHATWOOT_TOKEN" -H 'Content-Type: application/json' \
  -X POST "$CW/conversations/<id>/messages" \
  -d '{"content":"Grazie, la ricontattiamo entro oggi.","message_type":"outgoing","private":false}'
```

Other useful endpoints: `GET $CW/contacts`, `GET $CW/contacts/search?q=...`, `GET $CW/inboxes`,
`POST $CW/conversations/<id>/labels`, `POST $CW/conversations/<id>/toggle_status`, `GET $CW/canned_responses`.
Full reference: https://developers.chatwoot.com/api-reference (OpenAPI in the repo at `swagger/swagger.json`).

Rules:
- **Always show the user the exact reply and get a yes before sending a message to a customer**
  (`private: true` creates an internal note instead, safe for drafts).
- Discover ids (inboxes, conversations, contacts) with GET; never invent them.
- Respect customer privacy: do not copy conversation contents outside Chatwoot without reason.
