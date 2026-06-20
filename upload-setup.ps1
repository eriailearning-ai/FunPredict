# Run this ONCE before deploy-staging.ps1
# Uploads the server setup script to SiteGround

$SG_USER = "u1835-ofp75bllscyp"
$SG_HOST = "gvam1284.siteground.biz"
$SG_PORT = "18765"

scp -P $SG_PORT "$PSScriptRoot\fifafun-setup.sh" "${SG_USER}@${SG_HOST}:~/fifafun-setup.sh"
Write-Host "✅ Setup script uploaded." -ForegroundColor Green
Write-Host "Now run: .\deploy-staging.ps1" -ForegroundColor Yellow
