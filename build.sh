#!/bin/sh

version=1.9.4
rm build -rf
if [ -z $DEBUG ]; then
	zip -r builds/zotero-scholar-citations-${version}-fx.xpi chrome/* chrome.manifest install.rdf
else
	zip -r builds/zotero-scholar-citations-${version}-debug.xpi chrome/* chrome.manifest install.rdf
fi
