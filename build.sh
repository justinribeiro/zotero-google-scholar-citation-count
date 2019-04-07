#!/bin/sh
version=$npm_package_version
mkdir -p build
zip -r build/zotero-scholar-citations-${version}-fx.xpi chrome/* chrome.manifest install.rdf
