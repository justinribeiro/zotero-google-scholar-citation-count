#!/bin/sh
version='1.9.5-snapshot'
mkdir -p build
zip -r build/zotero-scholar-citations-${version}-fx.xpi chrome/* chrome.manifest install.rdf
