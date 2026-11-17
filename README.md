# Client Contact Log — private Trello Power-Up

Adds a "Client contact log" section to every card: one record per contact with the client
(time, channel, who initiated, who logged it, summary). Comments & activity stay free for internal notes.

Version 1.0.0 · English and 简体中文 · private Power-Up, not for the public directory

## What it does

- Card back: add, edit and delete contact records; newest first; latest 5 shown, "Show all" for the rest
- Card front badge: days since the last client contact, red once it passes the limit set in Settings
- Board button "Client contact": cards sorted by longest silence, contacts in the last 7 days, CSV export of every record
- Settings: language, stale-contact days, channels (built-in + your own), lists that are never flagged
- A half-typed record survives a reload of the card section
- Records are shown only to board members with edit access

## Storage and its limit

Static files only: no server, no login, no analytics. Records live on the Trello card
(Power-Up pluginData, `card/shared`, key `log`); settings live on the board.

Trello allows 4096 characters of Power-Up data per card. Measured with this code:

| Summary length | Records per card |
|---|---|
| about 20 Chinese characters | about 80 |
| about 50 Chinese characters | about 50 |
| about 100 Chinese characters | about 32 |
| about 130 English characters | about 24 |

The footer shows space used. From 85% the section warns; when full, a new record is refused (the typed
text is kept). **Archive old records** shows the oldest records as text to copy into the client file,
then removes them from the card after you confirm. The card keeps a count of archived records.

These figures assume Trello counts one Chinese character as one character. That has not been checked on a
live board. If Trello counts differently, saves are refused earlier and the same "full" message appears.

Mobile: Trello's phone apps do not show custom Power-Up sections. Use the web version.

## Files

| File | Purpose |
|---|---|
| `index.html` + `connector.js` | Trello iframe connector: badges, card-back section, board button, settings |
| `section.html` + `section.js` | The contact log on the card back |
| `overview.html` + `overview.js` | The board overview modal |
| `settings.html` + `settings.js` | Board settings |
| `shared.js` / `i18n.js` / `ui.css` | Data logic / interface strings / styles |
| `icon.svg` / `icon-white.svg` | Icons |

Opening `section.html`, `overview.html` or `settings.html` outside Trello shows a demo with fictional data.

## Deploy

1. Create a **public** GitHub repository `client-contact-log` and upload every file in this folder to its
   root (code only, no client data).
2. Repository Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.
3. Check `https://<your-username>.github.io/client-contact-log/section.html` shows the demo.
4. https://trello.com/power-ups/admin → **New**:
   - Name: `Client Contact Log`; Workspace: yours
   - Iframe connector URL: `https://<your-username>.github.io/client-contact-log/index.html`
5. **Capabilities** tab, switch on these five:
   Board buttons · Card back section · Card badges · Card detail badges · Show settings
6. Board → Power-Ups → Custom → Client Contact Log → Add. Refresh the board.

## First-run checklist

Tested offline against a simulated Trello (data logic, connector, and the pages in Chrome).
**Not yet run inside a live Trello board.** On a test card:

1. The section "Client contact log" appears; add a record with a Chinese summary; close and reopen the card.
2. The card front shows "Contact today".
3. Edit the record, then delete it (✕ twice).
4. Board button "Client contact" opens the overview.
5. Power-Up Settings saves.

If something fails, press F12, open Console and copy the red lines.
