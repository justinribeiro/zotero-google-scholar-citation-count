#!/bin/sh

# set the version for our file
# requires NPM 7.20+
version=$(npm pkg get version | tr -d '"')

rm -rf build
mkdir -p build
cd src
zip -r ../build/zotero-google-scholar-citation-count-${version}.xpi *
cd ..

# patch the JSON file version
jq --arg version "$version" '.addons."justin@justinribeiro.com".updates.[0].version |= "\($version)"' updates.json | sponge updates.json

# patch the update link
updatelink="https://github.com/justinribeiro/zotero-google-scholar-citation-count/releases/download/v${version}/zotero-google-scholar-citation-count-${version}.xpi"
jq --arg updatelink "$updatelink" '.addons."justin@justinribeiro.com".updates.[0].update_link |= "\($updatelink)"' updates.json | sponge updates.json

# patch the hash for the XPI
hash=$(sh -c 'sha256sum < "$1" | cut -d" " -f1' -- ./build/zotero-google-scholar-citation-count-${version}.xpi)
jq --arg hash "$hash" '.addons."justin@justinribeiro.com".updates.[0].update_hash |= "sha256:\($hash)"' updates.json | sponge updates.json
