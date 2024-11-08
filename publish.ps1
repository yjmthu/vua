# remove vua.crx
$crxPath = "./dist/vua.crx"
if (Test-Path $crxPath) {
  Remove-Item -Path "$crxPath" -Force
}

# move dist.crx to vua.crx
$distPath = "./dist.crx"
if (Test-Path $distPath) {
  Move-Item -Path "$distPath" -Destination "$crxPath"
}

# absolute path to vua.crx
$crxPath = (Get-Item -Path "$crxPath").FullName
# absolute path of dist folder
$distPath = (Get-Item -Path "./dist").FullName

$repo = (Get-Item -Path "../yjmthu.github.io/vua").FullName
# remove all files and folders in vua folder
Remove-Item -Path "$repo/*" -Recurse -Force

# copy all files and folders in dist folder to vua folder
Copy-Item -Path "$distPath/*" -Destination "$repo" -Recurse -Force

# change current directory to vua folder
$lastLocation = Get-Location
Set-Location -Path "$repo"
git add .
git commit -m "update vua"
git push

# change back to last location
Set-Location -Path $lastLocation
