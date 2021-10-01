# Google Scholar Citation Count for Zotero
[![Zotero +v5.0](https://img.shields.io/badge/Zotero-%3E%3D%205.x-brightgreen)](https://www.zotero.org/)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

## Latest Version

[![v3.0.2](https://img.shields.io/badge/Download-v3.0.2-orange?style=for-the-badge)](https://github.com/justinribeiro/zotero-scholar-citations/releases/download/v3.0.2/zotero-scholar-citations-3.0.2-fx.xpi)

## Current Test Coverage

![Statements](https://img.shields.io/badge/statements-66.66%25-red.svg)
![Branches](https://img.shields.io/badge/branches-67.27%25-red.svg)
![Functions](https://img.shields.io/badge/functions-58.62%25-red.svg)
![Lines](https://img.shields.io/badge/lines-68.25%25-red.svg)

## Install / Update
Install via `Tools > Add-Ons` within Zotero and use the `Install Add-On from file...` from the settings icon menu as shown in the screenshot below:

![image](https://user-images.githubusercontent.com/643503/135676188-7ab92614-9376-4271-9277-7b3a5c2a8768.png)

## Brief Note From Justin
There are a _lot_ of versions of this plugin from various folks with specific patches. This is my fork, of a fork, of a fork, that originally was from [Anton Beloglazov](https://beloglazov.info/) back in 2011 (and I have not cleaned up the authorship yet within package, I'm getting there :-).

Regardless, I'm going to try to mix the old (hello XUL my old friend) and the new (ECMAScript you could use a bump). If you've stumbling here, you're probably in my Doctorate cohort but the plugin has been tested in Zotero 5.x, so have at it.

![image](https://user-images.githubusercontent.com/643503/135185125-060d1951-5b20-40b6-98f0-8783d9846ad3.png)

# Zotero Scholar Citations (ZSC)
This is an add-on for Zotero, a research source management tool. The add-on automatically fetches numbers of citations of your Zotero items from Google Scholar and makes it possible to sort your items by the citations. Moreover, it allows batch updating the citations, as they may change over time.

## Installation
The add-on supports Zotero Standalone. To install it:
1. Download the latest version of the add-on from [the release page](https://github.com/justinribeiro/zotero-scholar-citations/releases). It's an ".xpi" file.
1. In Zotero (Standalone) go to Tools -> Add-ons -> click the settings button in the top-right corner -> Install Add-on From File -> select the downloaded file and restart Zotero.

## Extra Column Info
Currently, Zotero doesn't have any special field for the number of citations, that's why it is stored in the "Extra" field. To sort by this field you have to add it in the source listing table.
