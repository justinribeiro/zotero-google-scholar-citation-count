# RoadMap

## 2.1.0
- improve captcha handling & introduce request batching
    - if you update 200 papers you prob get captchas starting at 100 or so
    - all remaining request will run into a captcha an result in a prompt
    - even when the captcha situation is resolved, those items won't be updated unless another update is requested
    - **solution/workaround**
        - can't get around some sort of batching/sequencing
        - if you throw 100 requests into the event loop, they'll happen no matter what
        - i.e. you have to stop throwing requests into the event loop once you get the first captchas, then wait for the captcha to be resolved
- properly handle a 429
    - i.e. pause request for the specified time

## 2.2.0
- author & date shinanigans
    - sometimes papers are not found because not all authors are listed as such on google scholar
    - same goes for the date
    - another failure source: discrepancy between title that GS lists and Zoteros title field
      - remove stop words from titles?
    - **solution/workaroud**
        - depends on the ability to redo requests at will
        - start with dropping the date
        - if still no citation is found retry with permutations of authors, decreasing in number of authors
        - probably increases scholar query success rate
            - e.g. "Probabilistic roadmaps for path planning in high-dimensional configuration spaces"
            - there's different versions!
        - big but(t): probably increases rate of false positives as well …
        - how to signify the confidence in the zitation count?

## 2.3.0
- add a minimal config dialog to allow configuration at runtime
    - GS base URL is a good candidate; it would allow the use of webproxies

## Soon(tm)
**note:** this is a randomly ordered todo list, higher up the list doesn't imply higher priority
- automatically update version number (i.e. in install.rdf)
- clean up variable handling
    - e.g. `this`/`zsc.` right now zsc. is just an almost global storage for eveything)
    - use acutal private variables & closures?
- fix build system, so ppl can contribute
    - the whole npm thingy might be a bad idea in the first place
        - zsc is run in a browser, it should probably tested that way as well
        - but the whole XUL part is nasty AF
    - purely npm/package.json based?
    - true OS independence
        - i.e. I have to fix my tools first
        - either go full cygwin stack or full windose (but cmd is soo shit q.q)
        - there's no node/npm as a package in cygwin q.q; prob. have to compile it
        - alternative: do everything in node
- rework citation field
    - can't do this before Zotero 5.2 apparently :(
        - **custom fields** [have been planned for ages](https://forums.zotero.org/discussion/65301/adding-a-custom-information-field)
        - currently they're planned for Zotero 5.2 (heh)
    - use a name that's more citation-related than "extra" [as mentioned here](https://github.com/beloglazov/zotero-scholar-citations/issues/37)
    - fix citation field type, which also fixes all sorts of [length issues](https://github.com/beloglazov/zotero-scholar-citations/issues/31)
