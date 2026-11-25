#!/bin/bash
# Bundles Jarvis into ONE html file (all modules inlined) — some browsers refuse multi-file artifacts.
set -e
python3 /tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/j3/gen_skills.py >/dev/null
S=/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad; J=$S/j3
$S/tools/node_modules/.bin/esbuild $J/app/app.js --bundle --format=esm --target=es2020 --external:three --external:'three/addons/*' --minify-syntax --outfile=$J/dist/bundle.js --log-level=warning
python3 - <<'PY'
J='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/j3/'
h=open(J+'app/index.html').read(); b=open(J+'dist/bundle.js').read().replace('</script','<\\/script')
tag='<script type="module" src="app.js"></script>'
assert h.count(tag)==1
open(J+'dist/index.html','w').write(h.replace(tag,'<script type="module">\n'+b+'\n</script>'))
print('single file:',len(h)+len(b),'bytes')
PY
