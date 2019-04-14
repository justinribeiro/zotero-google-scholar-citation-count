# Zotero Scholar Citations (ZSC)

This is an add-on for Zotero, a research source management tool. The add-on automatically fetches numbers of citations of your Zotero items from Google Scholar and makes it possible to sort your items by the citations. Moreover, it allows batch updating the citations, as they may change over time.

When updating multiple citations in a batch, it may happen that citation queries are blocked by Google Scholar for multiple automated requests. If a blockage happens, the add-on opens a browser window and directs it to http://scholar.google.com/, where you should see a Captcha displayed by Google Scholar, which you need to enter to get unblocked and then re-try updating the citations. It may happen that Google Scholar displays a message like the following "We're sorry... but your computer or network may be sending automated queries. To protect our users, we can't process your request right now." In that case, the only solution is to wait for a while until Google unblocks you.

Currently, Zotero doesn't have any special field for the number of citations, that's why it is stored in the "Extra" field. To sort by this field you have to add it in the source listing table.

*IMPORTANT:* in version 1.8 the field for storing the number of citations has been changed from "Call Number" to "Extra" -- please update your column configuration.

The add-on supports both versions of Zotero:

  1. Download the lastest version of the add-on from [the release page](https://github.com/MaxKuehn/zotero-scholar-citations/releases). It's an ".xpi" file.
  1. In Zotero (Standalone) go to Tools -> Add-ons -> click the settings button in the top-right corner -> Install Add-on From File -> select the downloaded file and restart Zotero.

Read about how the add-on was made: http://blog.beloglazov.info/2009/10/zotero-citations-from-scholar-en.html

## Why the Fork

The original maintainer [Anton Beloglazov](https://github.com/beloglazov) seems semi-active.

[Texot](https://github.com/tete1030) fixed some stuff that needed fixing BADLY, that is

- Fix detection of google robot checking
- Show `No Citation Data` in failure cases instead of `00000`

**But there's more that should be done!**

## RoadMap

[RoadMap](https://github.com/MaxKuehn/zotero-scholar-citations/RoadMap.md)

## "Extra"-Column Content Handling
ZSC will
- update legacy ZSC "extra"-content, i.e. 5 digit citation counts and "No Citation Data" strings
- respect content that is in the "Extra"-field as long as it's in `key: value` format
    - this includes arXiv, DOI, OCLC, etc.
    - problably not combination of those unless they are ` \n` separated

## Why is ZSC unable retrieve the citation count for item X?
The most likely culprit is that ZSC search is too precise :^). Some Items do not have as complete of an author list on google scholar as they have in Zotero.

Here's how you can find out weather that's the problem
1. in Zotero enable debug out `Help > Debug Output Logging > enable`
1. then open the debug console `Help > Debug Output Logging > View Output`
1. try to update the item again
1. look out for something like this `[scholar-citations] GET https://scholar.google.com/scholar?hl=en&as_q=THE_TITLE_OF_YOUR_ITEM&as_epq=&as_occt=title&num=1&as_sauthors=AUTHOR1+AUTHOR2+AUTHOR3`
1. Copy & Paste that search link into a web browser of your choice
1. try removing different authors from the search

One combination of authors will certainly yield the correct search.

You can also temporarly recreate that combination in Zotero. ZSC will then successfully query that item. Once you re-add the author however, updates will fail again. :(

# License

Copyright (C) 2011-2013 Anton Beloglazov?

Distributed under the Mozilla Public License 2.0 (MPL).
