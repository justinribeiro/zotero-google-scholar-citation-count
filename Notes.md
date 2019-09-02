# Notes

## Item/Extra Update & Migration
### New Cite Count
- simple cases
    - empty -> update
    - ZSC only -> update
    - legacy ZSC only -> update
    - no ZSC content yet -> prepend
- "complex" cases
    - ZSC content is somewhere in extra -> update
### Cite Count Retrieval Failed
- simple cases
    - empty -> add "NoData"
    - no ZSC content yet -> prepend "NoData"
    - legacy fields -> update to new format, but mark as stale
    - ZSC only -> mark as stale
- "complex cases"
    - ZSC content somewhere in extra -> mark as stale
### Summary
- once migrated most of it can be done witha single regex + replace :)
    - drop line separating and only use positive look behind?
- exceptions, which both are easy to recognize & handle, are
    - empty field
    - no ZSC content yet

## Staleness
- once it's marked as stale, how to signal further staleness?
- staleness counter? requires retrieving previous staleness count
    - e.g. `ZSCC: 0000000` -> `ZSCC: 0000000s1` -> `ZSCC: 0000000s2`
- problem: I'd like to find them w/ a search or sorting!
    - soo something like `ZSCC: 0000000` -> `ZSCC: 0000000|s1` -> `ZSCC: 0000000|s2`?
    - soo something like `ZSCC: 0000000` -> `ZSCC: 0000000(s1)` -> `ZSCC: 0000000(s2)`?
    - soo something like `ZSCC: 0000000` -> `ZSCC: 0000000[s1]` -> `ZSCC: 0000000[s2]`?
    - you can search for `|s`, `(s`, `[s`
    - or add an entire field? e.g. `ZSCT: 00`
        - meh

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
### Zotero
- the "Switch to single field" button saves the author name in the field "lastName"
    - are you fucking shitting me? why the fuck would you do that?
    - I guess I just can't assume that a field named "lastName" contains the authors last name m(

## Debug
- Zotero is basically a (firefox-like) browser?
- in Zotero: **Tools** > **Developer** > **Run JavaScript**
    - then execute whatever JavaScript you want
    - the console `toString`s the return values in the right pane
    - might have to `JSON.stringify()` them before that
- Friends
    - `window`, `Zotero`, `ZoteroPane` Objects
    - `alert(…)` works
    - `Object.keys()` to show (enumerable) properties
### Gotchas
- you can easily crash that console and then you have to restart zotero :(
