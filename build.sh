#!/bin/sh

# set the version for our file
# requires NPM 7.20+
version=$(npm pkg get version | tr -d '"')

# patch the RDF file version
sed -i "s/^.*em:version.*$/        em:version=\"${version}\"/" install.rdf

mkdir -p build
zip -r build/zotero-scholar-citations-${version}-fx.xpi chrome/* chrome.manifest install.rdf
