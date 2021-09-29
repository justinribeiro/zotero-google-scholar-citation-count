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
