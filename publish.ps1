$crxPath = "./dist/vua.crx"
$distPath = "./dist.crx"
if (Test-Path $distPath) {
  Move-Item -Path "$distPath" -Destination "$crxPath"
} else {
  Write-Host "dist.crx not found"
  exit
}

$distPath = (Get-Item -Path "./dist").FullName
$repo = (Get-Item -Path "../yjmthu.github.io/vua").FullName

$lastLocation = Get-Location
Set-Location -Path "$repo"

git pull
git merge
Remove-Item -Path "$repo/*" -Recurse -Force
Copy-Item -Path "$distPath/*" -Destination "$repo" -Recurse -Force

git add .
git commit -m "update vua"
git push

# change back to last location
Set-Location -Path $lastLocation
