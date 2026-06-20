#!/bin/bash
# FIFAFun Server Setup
# Run: bash ~/fifafun-setup.sh

set -e
APP_DIR="$HOME/www/stage.eagledrop.net"
ZIP="$HOME/fifafun-deploy.zip"
PORT=4001

echo ""
echo "FIFAFun staging setup"
echo "---------------------"

# 1. Extract zip
echo "Extracting deploy package..."
cd "$APP_DIR"
chmod -R u+rwX . 2>/dev/null || true
[ -f .env ] && cp .env .env.backup && echo "  (.env backed up)"
find . -mindepth 1 -not -name '.env.backup' -delete 2>/dev/null || true

python3 - <<'PYEOF'
import zipfile, os
with zipfile.ZipFile(os.path.expanduser("~/fifafun-deploy.zip")) as z:
    count = 0
    for m in z.infolist():
        m.filename = m.filename.replace("\\", "/")
        if m.filename.endswith("/"):
            os.makedirs(os.path.join(os.getcwd(), m.filename), exist_ok=True)
            continue
        t = os.path.join(os.getcwd(), m.filename)
        os.makedirs(os.path.dirname(t), exist_ok=True)
        with z.open(m) as s, open(t, "wb") as d:
            d.write(s.read())
        count += 1
    print(f"  Extracted {count} files")
PYEOF

[ -f .env.backup ] && mv .env.backup .env

# 2. Create .env if missing
if [ ! -f .env ]; then
  echo "Creating .env..."
  SECRET=$(openssl rand -base64 32)
  CRON=$(openssl rand -hex 16)
  cat > .env << ENVEOF
DATABASE_URL="file:./staging.db"
NEXTAUTH_URL="https://stage.eagledrop.net"
NEXTAUTH_SECRET="${SECRET}"
EMAIL_FROM="FIFAFun 2026 <noreply@eagledrop.net>"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD="P@ss"
ADMIN_EMAIL="bro.gothe@gmail.com"
FOOTBALL_DATA_API_KEY=""
CRON_SECRET="${CRON}"
ENVEOF
  echo "  .env created"
fi

# 3. Install dependencies (skip postinstall to avoid Prisma WASM)
echo ""
echo "Installing dependencies..."
npm install --legacy-peer-deps --ignore-scripts 2>&1 | tail -3

# 4. Set up Prisma client
echo ""
echo "Setting up Prisma client..."
mkdir -p node_modules/.prisma/client

# Copy pre-generated JS client files
if [ -d "_prisma_prebuilt" ]; then
    cp -r _prisma_prebuilt/. node_modules/.prisma/client/
    echo "  JS client files restored"
fi

# Download Linux engine binary from Prisma CDN
echo "  Downloading Linux engine binary..."
PLATFORM="debian-openssl-3.0.x"
BINARY="node_modules/.prisma/client/libquery_engine-${PLATFORM}.so.node"

# Get engine hash from installed packages
ENGINE_HASH=$(node -e "
const fs = require('fs');
const checks = [
  'node_modules/@prisma/engines-version/package.json',
  'node_modules/prisma/package.json',
  'node_modules/@prisma/client/package.json',
];
for (const f of checks) {
  try {
    const p = JSON.parse(fs.readFileSync(f, 'utf8'));
    const str = JSON.stringify(p);
    const m = str.match(/[0-9a-f]{40}/);
    if (m) { console.log(m[0]); process.exit(0); }
  } catch(e) {}
}
console.log('605197351a3c8bdd595af2d2a9bc3025bca48ea');
" 2>/dev/null)

echo "  Engine hash: $ENGINE_HASH"

CDN="https://binaries.prisma.sh/all_commits/${ENGINE_HASH}/${PLATFORM}/libquery_engine.so.node.gz"
if curl -fsSL --max-time 120 "$CDN" -o "${BINARY}.gz" 2>/dev/null; then
    gunzip -f "${BINARY}.gz"
    chmod +x "$BINARY"
    echo "  Binary ready: $BINARY"
else
    # Try without gz
    CDN2="https://binaries.prisma.sh/all_commits/${ENGINE_HASH}/${PLATFORM}/libquery_engine.so.node"
    if curl -fsSL --max-time 120 "$CDN2" -o "$BINARY" 2>/dev/null; then
        chmod +x "$BINARY"
        echo "  Binary ready (plain): $BINARY"
    else
        echo "  Binary download failed - checking older platform..."
        PLATFORM2="debian-openssl-1.1.x"
        BINARY2="node_modules/.prisma/client/libquery_engine-${PLATFORM2}.so.node"
        CDN3="https://binaries.prisma.sh/all_commits/${ENGINE_HASH}/${PLATFORM2}/libquery_engine.so.node.gz"
        if curl -fsSL --max-time 120 "$CDN3" -o "${BINARY2}.gz" 2>/dev/null; then
            gunzip -f "${BINARY2}.gz"
            chmod +x "$BINARY2"
            echo "  Binary ready (fallback): $BINARY2"
        else
            echo "  WARNING: Could not download binary. App may not handle DB queries."
        fi
    fi
fi

# 5. Create SQLite database schema
echo ""
echo "Setting up database..."
if command -v sqlite3 &>/dev/null; then
    sqlite3 staging.db < prisma/init-schema.sql
    echo "  Database ready"
else
    echo "  sqlite3 not found"
    exit 1
fi

# 6. Start with PM2
echo ""
echo "Starting app with PM2..."
npm install pm2 --ignore-scripts 2>&1 | tail -1
PM2="$APP_DIR/node_modules/.bin/pm2"
$PM2 delete fifafun-staging 2>/dev/null || true
$PM2 start npm --name "fifafun-staging" --log "$APP_DIR/pm2.log" -- start -- -p $PORT
$PM2 save

# 7. Apache proxy
echo ""
echo "Configuring Apache proxy..."
cat > .htaccess << 'HTEOF'
DirectoryIndex disabled
Options -Indexes -MultiViews
RewriteEngine On
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) ws://127.0.0.1:4001/$1 [P,L]
RewriteRule ^$ http://127.0.0.1:4001/ [P,L]
RewriteRule ^(.+)$ http://127.0.0.1:4001/$1 [P,L]
ProxyPassReverse / http://127.0.0.1:4001/
HTEOF
echo "  .htaccess created"

echo ""
echo "Deploy complete!"
echo "  Visit: https://stage.eagledrop.net"
echo "  Logs:  node_modules/.bin/pm2 logs fifafun-staging --lines 30"
echo ""
echo "Next: Register at /auth/register, approve in /admin, then Seed Matches"
