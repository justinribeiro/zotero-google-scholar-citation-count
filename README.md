# Google Scholar Citation Count for Zotero

> Add-on that fetches numbers of citations of your Zotero collection items from Google Scholar, adding the citation count to the extra column for reference and sorting.

[![Zotero +7.0](https://img.shields.io/badge/Zotero-%3E%3D%205.x-brightgreen)](https://www.zotero.org/)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
![Test Coverage - Statements](https://img.shields.io/badge/statements-69.23%25-red.svg)
![Test Coverage - Branches](https://img.shields.io/badge/branches-59.79%25-red.svg)
![Test Coverage - Functions](https://img.shields.io/badge/functions-67.30%25-red.svg)
![Test Coverage - Lines](https://img.shields.io/badge/lines-70.14%25-red.svg)

## Download Latest Version

Zotero 8 - [![v5.0.0](https://img.shields.io/badge/Download-v5.0.0-orange?style=for-the-badge)](https://github.com/justinribeiro/zotero-scholar-citations/releases/download/v5.0.0/zotero-google-scholar-citation-count-5.0.0.xpi)

Zotero 7 - [![v4.3.0](https://img.shields.io/badge/Download-v4.3.0-orange?style=for-the-badge)](https://github.com/justinribeiro/zotero-scholar-citations/releases/download/v4.3.0/zotero-google-scholar-citation-count-4.3.0.xpi)

Zotero 6 - [![v3.2.2](https://img.shields.io/badge/Download-v3.2.2-orange?style=for-the-badge)](https://github.com/justinribeiro/zotero-scholar-citations/releases/download/v3.2.2/zotero-google-scholar-citation-count-3.2.2.xpi)

## What's New
_v5.0.0_ - Support for Zotero 8.

_v4.3.0_ - Automatically pull citations on item addition (enabled via preference); adds new relative relevance score column (see [issue #28](https://github.com/justinribeiro/zotero-google-scholar-citation-count/issues/28)); plugin now shows small popup when pulling citations.

![New Preferences for auto-pulling citation count on add](https://github.com/user-attachments/assets/5eb3bc94-f0e1-42a9-bf3e-6f72f07ed595)

_v4.2.0_ - Adds ability to set custom Google Scholar endpoint; removes HTML from title search strings; saves column width state per Zotero documentation.

![New Preferences for setting custom Google Scholar API endpoint](https://github.com/user-attachments/assets/1e499d4d-6fc5-4c2e-aa23-440df4554fa5)

_v4.1.0_ - New translations, new preferences panel, and new search options! Matching is hard (see the Citation Counts note), but we can make it better. The preferences panel now let's your tighten or loosen some of the search parameters to Google Scholar for you use case. This is the first pass, more options to come!

![New Preferences Panel for Citation Count](https://github.com/user-attachments/assets/4f640d7a-4b3b-42fe-b5ac-bf51dcd7f68d)

_v4.0.0_ - This release is specifically adding the initial support for the upcoming Zotero 7. The most significant feature addition is that there is now a custom data column available that allows seeing Citation Count. See [the sample video](https://www.youtube.com/watch?v=wgW74lL_tgI) for usage. If you find issues in Zotero 7 beta, please let me know so we can squash some bugs!

## A Note About Citation Counts

A common reported issue in the tracker is "Justin, it doesn't report the correct number of citations". I understand the frustration. Many people offer varying solutions that often fit for very limited cases or papers, but I cannot on the whole edge case them all. However, if you're looking for a definitive number of citations for a given resource, Google Scholar is not the tool for that usage. GS has known issues with this (it'll report wildly in some cases, see https://fediscience.org/@ct_bergstrom/111303567826479298 for one such case).

This plugin does its best to try to use what Google Scholar returns as a guidepost and nothing more. There isn't much I can do plugin-wise to resolve this without using making it very very opinionated (which I have tried to keep in check, because that has it's own problems for maintenance and viability).

Feel free to report this issue as you see fit; I will always try to resolve as best I can!

## Demo

Version 4.x:
https://www.youtube.com/watch?v=wgW74lL_tgI

Version 3.x:
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


