#!/usr/bin/env bash
# Installa tutto quello che serve a Jarvis su un Mac Apple Silicon.
# Uso: dalla cartella del repo ->  bash jarvis/installa-jarvis.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OGA_VERSION="2.0.0"
OGA_DMG_URL="https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v${OGA_VERSION}/Open.Generative.AI-${OGA_VERSION}-arm64.dmg"

passo() { printf '\n\033[1;33m==> %s\033[0m\n' "$1"; }

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Questo script è per Mac con chip Apple (M1–M5)."; exit 1
fi

passo "1/5 Homebrew (gestore programmi per Mac)"
if ! command -v brew >/dev/null 2>&1; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
  grep -q 'brew shellenv' "$HOME/.zprofile" 2>/dev/null || \
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
else
  echo "Già installato."
fi

passo "2/5 Claude Code (il cervello di Jarvis)"
if ! command -v claude >/dev/null 2>&1; then
  curl -fsSL https://claude.ai/install.sh | bash
else
  echo "Già installato."
fi

passo "3/5 VoiceStudio (voci gratis in locale)"
if [[ -d "/Applications/VoiceStudio.app" ]]; then
  echo "Già installato."
else
  brew install --cask debpalash/tap/voicestudio
fi

passo "4/5 Open Generative AI (immagini; gratis con i modelli locali)"
if [[ -d "/Applications/Open Generative AI.app" ]]; then
  echo "Già installato."
else
  TMP="$(mktemp -d)"
  curl -fL --progress-bar -o "$TMP/oga.dmg" "$OGA_DMG_URL"
  MNT="$(hdiutil attach -nobrowse -readonly "$TMP/oga.dmg" | awk -F'\t' '/\/Volumes\//{print $NF}')"
  cp -R "$MNT/Open Generative AI.app" /Applications/
  hdiutil detach "$MNT" -quiet
  rm -rf "$TMP"
  # L'app non è firmata da Apple: questo è il passaggio indicato dagli autori per aprirla.
  xattr -cr "/Applications/Open Generative AI.app"
fi

passo "Extra: OpenWhispr (dettatura vocale gratis)"
if [[ -d "/Applications/OpenWhispr.app" ]]; then
  echo "Già installato."
else
  brew install --cask openwhispr || echo "OpenWhispr non installato: scaricalo da github.com/OpenWhispr/openwhispr/releases"
fi

passo "5/5 Comando 'jarvis' nel terminale"
LINE="alias jarvis='cd \"$REPO_DIR\" && claude'"
if grep -q "alias jarvis=" "$HOME/.zshrc" 2>/dev/null; then
  echo "Comando già presente in ~/.zshrc."
else
  echo "$LINE" >> "$HOME/.zshrc"
  echo "Aggiunto a ~/.zshrc."
fi

cat <<'FINE'

Fatto! Ultimi passi (una volta sola):
  1. Chiudi e riapri il Terminale, poi scrivi:  jarvis
     (la prima volta Claude ti chiede di accedere col tuo account)
  2. Apri "Open Generative AI" → Settings → Local Models:
     installa il motore sd.cpp e scarica "Z-Image Turbo" (~8 GB).
     In Image Studio attiva il pulsante ⚡ Local: immagini gratis.
  3. Apri "VoiceStudio": scarica un modello voce quando te lo chiede.
  4. Apri "OpenWhispr": scegli un modello locale (es. Parakeet o Whisper) per dettare gratis.
  5. OpenProject (opzionale): chiedi a Jarvis "installa OpenProject" (serve Docker Desktop).
FINE
