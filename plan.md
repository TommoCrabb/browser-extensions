manifest.json
background.html
background.js
    *import mods.json*
    *store, retrieve, export settings*
        *mod-id*
            *enabled = bool*
            *custom-urls = array*
mods.json
__browser-popup__
    `Allow the user to turn modifications on or off for the current page.`
    `Include a second page for configuring CSS options for the current page.`
    `Include a button for opening the main options page.`
    popup.html
    popup.css
    popup.js
__page-popup__
    `Allow the user to turn modifications on or off for the current page.`
__options-page__
    `Give the user a checklist of all installed modifications.`
    options.html
    options.js
    options.css
__scripts__
    `Folders containing site-specific mods.`
    __example1__
        example.manifest.json
            *name = string*
            *uuid = uuid*
            *default-urls = array*
            *content-scripts = array*
            *style-sheets = array*
        example.content-script.js
        example.style-sheet.css
__styles__
__widgets__
    `Generic html widgets that can be used to build graphical user interfaces in site-specific mods.`
    panel.mjs
    floating-panel.mjs
    multi-selection-list.mjs
    text-input.mjs
    keymap.mjs
    _etc_

---

## Considerations

### Page Action vs Browser Action
Decision => Browser action

--- 

# Browser Extensions
+ keyboard navigation
+ content scraper
+ content blocker
+ page archiver
+ user scripts & styles
+ tabs & bookmarks
+ downloads

# Web Apps
+ calculator
+ calendar
+ word processor
+ email client
+ agregator
    + news
    + sports
    + weather
    + stocks