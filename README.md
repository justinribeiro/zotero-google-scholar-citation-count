# Google Scholar Citation Count for Zotero

> Add-on that fetches numbers of citations of your Zotero collection items from Google Scholar, adding the citation count to the extra column for reference and sorting.

[![Zotero +v5.0](https://img.shields.io/badge/Zotero-%3E%3D%205.x-brightgreen)](https://www.zotero.org/)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
![Test Coverage - Statements](https://img.shields.io/badge/statements-66.66%25-red.svg)
![Test Coverage - Branches](https://img.shields.io/badge/branches-67.27%25-red.svg)
![Test Coverage - Functions](https://img.shields.io/badge/functions-58.62%25-red.svg)
![Test Coverage - Lines](https://img.shields.io/badge/lines-68.25%25-red.svg)

## Download Latest Version

[![v3.0.2](https://img.shields.io/badge/Download-v3.0.2-orange?style=for-the-badge)](https://github.com/justinribeiro/zotero-scholar-citations/releases/download/v3.0.2/zotero-scholar-citations-3.0.2-fx.xpi)

## Demo

https://user-images.githubusercontent.com/643503/135680344-1887a48f-07e6-424f-aa9a-540092041baa.mp4


## Install / Update
Install via `Tools > Add-Ons` within Zotero and use the `Install Add-On from file...` from the settings icon menu as shown in the screenshot below:

![image](https://user-images.githubusercontent.com/643503/135676188-7ab92614-9376-4271-9277-7b3a5c2a8768.png)

Make sure to restart Zotero for the plug-in to take effect.

## Using the Plugin

Right click on an item or collection and select `Update Google Scholar citation count...`, which will then update the item(s) field `extra` with a `GSCC: NNNNNNN`:

![image](https://user-images.githubusercontent.com/643503/135185125-060d1951-5b20-40b6-98f0-8783d9846ad3.png)

## The Robot Problem

Google Scholar is a pain in the neck. Google makes no API available, so sometimes you'll get a message asking you to confirm you're not a robot via a recaptcha:

![the dreaded recaptcha](https://user-images.githubusercontent.com/643503/135678671-86d15772-c187-4043-9bc1-2f3725e1f0a5.png)

In this case, complete the recaptcha and close the resulting window and run your citation count update again.

## I can't get past the recaptcha!

Depending on how many items you're trying to update, Google Scholar might temporarily block you from such requests (and the plugin will continue prompting). In this case, restart Zotero (usually resolves issues) or let it cool down (go get cup of coffee, try citation count update again later).

This is an imperfect science until I do...some other things. :-)

## Brief Note From Justin

If you've stumbling here, you're probably in my Doctorate cohort at [Case Western Reserve University](https://www.zotero.org/groups/4418982/cwru_dbap_2024) and are using Zotero.

If you're not, the gist is this: there are a _lot_ of versions of this plugin from various folks with specific patches. This is my fork, of a fork, of a fork, that originally was from [Anton Beloglazov](https://beloglazov.info/) back in 2011.

Regardless of those various patchwork forks, I've decided to do a quick rewrite to clean up and resolve some oddness I had noticed in other variations. I'm basically mixing a lot of old knowledge (hello Firefox Add-On system...[those were the days my old friend](https://www.youtube.com/watch?v=Iu2aOk6b_Gs)) and a lot of new knowledge (ECMAScript and the web platform, I can't quit you).


