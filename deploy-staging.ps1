# FIFAFun Staging Deploy
# Usage: .\deploy-staging.ps1

$SG_USER = "u1835-ofp75bllscyp"
$SG_HOST = "gvam1284.siteground.biz"
$SG_PORT = "18765"
$ZIP     = "$env:TEMP\fifafun-deploy.zip"
$SOURCE  = $PSScriptRoot

Set-Location $SOURCE

# Step 1: Generate Prisma client
# The Windows binary may be locked (in use by VS Code / another process).
# We delete any leftover .tmp files and point Prisma at the existing binary
# so it skips downloading a new one and just regenerates the JS files.
Write-Host "Regenerating Prisma client..." -ForegroundColor Cyan

$prismaClientDir = Join-Path $SOURCE "node_modules\.prisma\client"

# Delete any leftover .tmp files from previous failed attempts
Get-ChildItem $prismaClientDir -Filter "*.tmp*" -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

# Point Prisma at the existing binary to skip download
$existingBinary = Get-ChildItem $prismaClientDir -Filter "*.dll.node" -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($existingBinary) {
    $env:PRISMA_QUERY_ENGINE_LIBRARY = $existingBinary.FullName
    Write-Host "  Using existing binary: $($existingBinary.Name)" -ForegroundColor Gray
}

npx prisma generate
$genResult = $LASTEXITCODE
$env:PRISMA_QUERY_ENGINE_LIBRARY = $null   # clear env var

if ($genResult -ne 0) {
    Write-Host "prisma generate failed. Try closing VS Code and any terminals running the app, then retry." -ForegroundColor Red
    exit 1
}

# Save a clean copy for future runs (excluding binary)
$prismaPrebuilt = Join-Path $SOURCE "_prisma_prebuilt"
if (Test-Path $prismaPrebuilt) { Remove-Item $prismaPrebuilt -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $prismaPrebuilt | Out-Null
Get-ChildItem $prismaClientDir -Exclude "*.node","*.tmp*" |
    Copy-Item -Destination $prismaPrebuilt -Force
Write-Host "  Prisma client generated and saved to _prisma_prebuilt" -ForegroundColor Green

# Step 2: Build Next.js
Write-Host "Building Next.js app..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }
Write-Host "Build complete." -ForegroundColor Green

# Step 3: Create zip
Write-Host "Building deploy package..." -ForegroundColor Cyan
if (Test-Path $ZIP) { Remove-Item $ZIP -Force }

$exclude = @("node_modules", ".git", "deploy-staging.ps1", "upload-setup.ps1",
             "*.db", "*.zip", ".env.local", ".env.staging.example")

$tempDir = "$env:TEMP\fifafun-stage-tmp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Get-ChildItem -Path $SOURCE -Exclude $exclude | Copy-Item -Destination $tempDir -Recurse -Force

Get-ChildItem -Path $tempDir -Recurse -Directory -Filter "node_modules" |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

$cacheDir = Join-Path $tempDir ".next\cache"
if (Test-Path $cacheDir) { Remove-Item $cacheDir -Recurse -Force }

Compress-Archive -Path "$tempDir\*" -DestinationPath $ZIP -Force
Remove-Item $tempDir -Recurse -Force

$sizeMB = [math]::Round((Get-Item $ZIP).Length / 1MB, 1)
Write-Host "Package ready: $ZIP ($sizeMB MB)" -ForegroundColor Green

# Step 4: Upload
Write-Host "Uploading to SiteGround..." -ForegroundColor Cyan
scp -P $SG_PORT $ZIP "${SG_USER}@${SG_HOST}:~/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed." -ForegroundColor Red; exit 1 }

Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run in SSH:" -ForegroundColor Yellow
Write-Host "  bash ~/fifafun-setup.sh" -ForegroundColor White
