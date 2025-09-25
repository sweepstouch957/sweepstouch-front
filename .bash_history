export PS1="[CMD_BEGIN]\n\u@\h:\w\n[CMD_END]"; export PS2=""
export PS1="[CMD_BEGIN]\n\u@\h:\w\n[CMD_END]"; export PS2=""
export TERM=xterm-256color
export OPENAI_API_KEY="sk-iDGP9ERa47hUNTnujVqhJL"
export OPENAI_API_BASE="https://api.manus.im/api/llm-proxy/v1"
export OPENAI_BASE_URL="https://api.manus.im/api/llm-proxy/v1"
ps() { /bin/ps "$@" | grep -v -E '(start_server\.py|upgrade\.py|supervisor)' || true; }
pgrep() { /usr/bin/pgrep "$@" | while read pid; do [ -n "$pid" ] && cmdline=$(/bin/ps -p $pid -o command= 2>/dev/null) && ! echo "$cmdline" | grep -q -E '(start_server\.py|upgrade\.py|supervisor)' && echo "$pid"; done; }
source /home/ubuntu/.user_env && cd . && npm run build
source /home/ubuntu/.user_env && cd . && cd sweepstouch-dashboard && npm run build
source /home/ubuntu/.user_env && cd . && npm run build
source /home/ubuntu/.user_env && cd . && npm install @mui/system
source /home/ubuntu/.user_env && cd . && npm run build
source /home/ubuntu/.user_env && cd . && cd .. && zip -r sweepstouch-dashboard.zip sweepstouch-dashboard/ -x "sweepstouch-dashboard/node_modules/*" "sweepstouch-dashboard/.next/*" "sweepstouch-dashboard/.git/*"
source /home/ubuntu/.user_env && cd . && zip -r sweepstouch-dashboard.zip sweepstouch-dashboard/ -x "sweepstouch-dashboard/node_modules/*" "sweepstouch-dashboard/.next/*" "sweepstouch-dashboard/.git/*"
