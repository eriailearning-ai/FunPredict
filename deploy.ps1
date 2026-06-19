# FIFAFun deploy script — run from D:\DevApp\WorldCup2026-App
Set-Location $PSScriptRoot

Write-Host "==> Adding all changes..." -ForegroundColor Cyan
git add -A

Write-Host "==> Committing..." -ForegroundColor Cyan
$msg = if ($args[0]) { $args[0] } else { "chore: update styles and access control" }
git commit -m $msg

Write-Host "==> Pushing to GitHub..." -ForegroundColor Cyan
git push

Write-Host ""
Write-Host "If Vercel auto-deploy is still broken, run:" -ForegroundColor Yellow
Write-Host "  npx vercel --prod" -ForegroundColor White
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
