#!/bin/sh

version=1.9.4
if [ -z $DEBUG ]; then
	rm builds/zotero-scholar-citations-${version}-fx.xpi
	zip -r builds/zotero-scholar-citations-${version}-fx.xpi chrome/* chrome.manifest install.rdf
else
	rm builds/zotero-scholar-citations-${version}-debug.xpi
	zip -r builds/zotero-scholar-citations-${version}-debug.xpi chrome/* chrome.manifest install.rdf
fi
