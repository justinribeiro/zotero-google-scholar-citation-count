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

The [RoadMap can be found here](https://github.com/MaxKuehn/zotero-scholar-citations/blob/master/RoadMap.md).

## Extra Column Info

### New Format in 2.0.x
Version 2.0.0 introduced a new format for storing the citation count, i.e. `ZSCC: 0000001`. Unfortunately that means existing pre 2.0.0 entries are incompatible in terms of sorting and you have to update them.

#### Migration Tips
If you just straight up update your entire collection you're bound to run into a captcha. Once you do run into one, all following queued update request will fail and you will be prompted for each and every one of them. Consider updating your collection in batches of 5-10 items at a time.

This limitation is a major inconvenience and fixing or at least alleviating it is the first thing on the priorty list (see the RoadMap).

### Staleness
As of Version 2.0.2 items whose citation count could not be updated will be marked with a staleness counter `[s0]`, e.g. `ZSCC: 0000042[s0]`, to signal the user that ZSC was unable to update the number of citations.

If ZSC continuesly fails to update an item, it increases the staleness count up to a maximum of 9 and then wraps around.

The format of the staleness counter allows you to search for items with stale citation data by entering `[s` in Zoteros search bar.

### Existing "Extra"-Column Content
ZSC will
- update legacy ZSC "extra"-content, i.e. 5 digit citation counts and "No Citation Data" entries
- respect content that is already in the "Extra"-field
    - ZSC will simply prepend the citation count to any existing content, so you can sort by the extra field to get the most cited items

#### When Updates fail
Consider temporary cutting out/deleting the "Extra" content. ZSC will update the citation count. After that you can simply append the previously removed.

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
