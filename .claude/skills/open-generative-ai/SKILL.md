---
name: open-generative-ai
description: Download, install, and run Open Generative AI (github.com/Anil-matcha/Open-Generative-AI), an open-source studio for generating AI images, videos, lip sync, and workflows through the MuAPI.ai API. Use when the user asks for Open Generative AI, wants to generate images or videos with that studio, or wants to self-host/run it locally.
---

# Open Generative AI

Open-source web app (Next.js) and desktop app (Electron + Vite) for AI image, video,
cinema, lip sync, and workflow generation. Upstream repo:
https://github.com/Anil-matcha/Open-Generative-AI (MIT license).

It is NOT bundled in this repo: clone it fresh each time, outside the project, so
the `costruzione` repo stays light.

## Requirements

- Node.js 18+ and npm
- A **MuAPI.ai API key** (paid service): https://muapi.ai/access-keys
  The app asks for it in the interface on first use and stores it in the browser's
  localStorage. Never write the key into files in this repo or commit it.
  In a Claude Code cloud session, request it with the credential tool for host
  `api.muapi.ai` (header `x-api-key`) rather than having the user paste it in chat.

## Install

```bash
git clone --recurse-submodules https://github.com/Anil-matcha/Open-Generative-AI.git ~/Open-Generative-AI
cd ~/Open-Generative-AI
npm run setup   # REQUIRED: init submodules + npm install + build workspaces
```

`npm install` alone is not enough: `npm run setup` builds the internal packages
(`packages/Vibe-Workflow`, `packages/Open-Poe-AI`, `packages/Open-AI-Design-Agent`, `packages/studio`).

## Run

```bash
npm run dev            # web version (Next.js) -> http://localhost:3000
npm run electron:dev   # desktop app (needs a graphical display)
npm run build && npm run start   # production
```

In a cloud session, use `npm run dev` and report the port 3000 preview to the user.

## Troubleshooting

- `Couldn't find a 'pages' directory`: run from the repo root and make sure the
  submodules were cloned; rerun `npm run setup`.
- Empty `packages/*` folders: `git submodule update --init --recursive`.

## Code structure (for changes)

- `src/lib/muapi.js`: API client (`https://api.muapi.ai`, header `x-api-key`, submit + polling)
- `src/lib/models.js`: model definitions and endpoints
- `src/components/`: studios (ImageStudio, etc.)
- `app/`: Next.js routes (studio, workflow, agents, api)
- `project_knowledge.md` in the upstream repo: detailed technical documentation

## Notes

- The upstream README advertises "no content filters": usage remains subject to
  MuAPI's terms and the law; do not generate illegal content or deepfakes of real people
  without consent.
- Every generation consumes credits on the user's MuAPI account: tell the user before
  launching costly batch generations.
