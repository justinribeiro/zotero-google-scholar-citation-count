#!/bin/sh

# set the version for our file
# requires NPM 7.20+
version=$(npm pkg get version | tr -d '"')

# patch the RDF file version
#sed -i "s/^.*em:version.*$/        em:version=\"${version}\"/" install.rdf

rm -rf build
mkdir -p build
cd src
zip -r ../build/zotero-google-scholar-citation-count-${version}.xpi *
