# remove vua.crx
crx_path="./dist/vua.crx"
dist_crx_path="./dist.crx"
if [ -f "$dist_crx_path" ]; then
  mv "$dist_crx_path" "$crx_path"
fi

# absolute path
dist_path="$(pwd)/dist"
repo_path="$(pwd)/../yjmthu.github.io/vua"

if [ ! -d "$repo_path" ]; then
  echo "repo path not exist"
  exit 1
fi

cd $repo_path
git pull
git merge
# remove all files in repo
rm -rf *
# copy crx file to repo
cp -r $dist_path/* ./
# commit and push
git add .
git commit -m "update vua"
git push
cd $dist_path
