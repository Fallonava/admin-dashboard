$ProdDir = "C:\simed-production"
$SourceDir = "f:\Next\admin-dashboard"
$env:PM2_HOME = "C:\Users\ANTRIAN 1\.pm2"

Write-Host "1. Build Project Next.js"
cd $SourceDir
npm run build

Write-Host "2. Copy Assets"
Copy-Item -Recurse -Force ".next\static" ".next\standalone\.next\static"
Copy-Item -Recurse -Force "public" ".next\standalone\public"

Write-Host "3. Sinkronisasi File ke Production"
robocopy $SourceDir $ProdDir /MIR /XD .git .github /R:1 /W:1

cd $ProdDir
Write-Host "4. Restarting PM2 Cluster"
npx --yes pm2 kill
npx --yes pm2 flush
npx --yes pm2 start server.js --name "admin-dashboard" --env production
if (Test-Path "$ProdDir\wa-bot\index.js") {
    npx --yes pm2 start ".\wa-bot\index.js" --name "wa-worker"
}
npx --yes pm2 save --force
npx --yes pm2 list
