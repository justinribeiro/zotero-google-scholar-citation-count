# Notes

## Google Scholar Fu
- different publications of the same thing have separate cite counts :/
- google has special symbols
    - they matter less for certain searches, but they always modify the search in some way
    - that means throwing them out is the best bet
    - see [google-shortcut-commands](https://www.wabisabilearning.com/blog/google-shortcut-commands) for a list
- narrow searches
    - exact in-title search seems appropriate
    - author fields helps, but they are not as straight forward as they seem
        - there's quite a lot
    - further narrowing down with dates

## Gotchas
- the export part of the module is only relevant for the npm based testing
- what actually loads the plugin into zotero is the `<script/>`-section in overlay.xul!
- i.e. you can just check for `window` and then write your UI callbacks whereever you want them to be
