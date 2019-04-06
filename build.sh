#!/bin/sh
version='1.9.5-snapshot'
mkdir build
zip -r build/zotero-scholar-citations-${version}-fx.xpi chrome/* chrome.manifest install.rdf
