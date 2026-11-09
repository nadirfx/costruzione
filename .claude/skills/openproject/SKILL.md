---
name: openproject
description: Run and use OpenProject (github.com/opf/openproject), the open-source project management tool (tasks, Gantt, Kanban boards, time tracking, meetings, wiki), through its free API v3. Use when the user wants to install OpenProject, organize projects or construction jobs, create or update tasks (work packages), plan schedules, track time, or read project status.
---

# OpenProject

Open-source project management (alternative to Jira, Asana, MS Project). Free Community
edition, GPL-3.0. Upstream: https://github.com/opf/openproject — Docs: https://www.openproject.org/docs/

## Costs (tell the user)
- **Community edition self-hosted: free.**
- Hosted cloud: 14-day free trial, then paid.
- The official **MCP server is an Enterprise (paid) add-on** — do not rely on it. Use API v3,
  which is free in Community.

## Run locally on the Mac (Docker)

Needs Docker Desktop (free for personal use): `brew install --cask docker`, then open Docker once.

```bash
mkdir -p ~/openproject/{pgdata,assets}
SECRET_FILE=~/openproject/secret_key_base
[ -f "$SECRET_FILE" ] || openssl rand -hex 64 > "$SECRET_FILE"
docker run -d -p 8080:80 --name openproject --restart unless-stopped \
  -e SECRET_KEY_BASE="$(cat "$SECRET_FILE")" \
  -e OPENPROJECT_HOST__NAME=localhost:8080 \
  -e OPENPROJECT_HTTPS=false \
  -e OPENPROJECT_DEFAULT__LANGUAGE=it \
  -v ~/openproject/pgdata:/var/openproject/pgdata \
  -v ~/openproject/assets:/var/openproject/assets \
  openproject/openproject:18
```

- First start takes a few minutes. Open http://localhost:8080 — default login `admin` / `admin`,
  then it forces a password change.
- Keep the same `SECRET_KEY_BASE` forever (stored in `~/openproject/secret_key_base`), or data becomes unreadable.
- Stop/start: `docker stop openproject` / `docker start openproject`.
- Only expose it beyond localhost behind HTTPS and a proper `OPENPROJECT_HOST__NAME`.

## API access

1. User creates a token in OpenProject: avatar → **Account settings → Access tokens → API → + API token**.
2. Never print the token or commit it. Read it from an env var, e.g. `OPENPROJECT_TOKEN`.
3. Basic auth with username `apikey` and the token as password.

```bash
OP=http://localhost:8080/api/v3
curl -sS -u "apikey:$OPENPROJECT_TOKEN" "$OP/projects"
curl -sS -u "apikey:$OPENPROJECT_TOKEN" "$OP/projects/<id>/work_packages"
```

Create a task (work package):

```bash
curl -sS -u "apikey:$OPENPROJECT_TOKEN" -H 'Content-Type: application/json' \
  -X POST "$OP/projects/<id>/work_packages" \
  -d '{"subject":"Ordinare cemento","_links":{"type":{"href":"/api/v3/types/1"}}}'
```

Rules:
- Discover IDs (projects, types, statuses, users) with GET before writing; never invent them.
  Types: `GET /api/v3/types`, statuses: `GET /api/v3/statuses`.
- Updating a work package (`PATCH /api/v3/work_packages/<id>`) requires the current `lockVersion`
  from a fresh GET, or the server returns 409.
- Responses are HAL+JSON: data in fields, relations under `_links`, lists under `_embedded.elements`.
- Confirm with the user before deleting anything.
- Full spec: https://www.openproject.org/docs/api/ (OpenAPI file `docs/api/apiv3/openapi-spec.yml` in the repo).
