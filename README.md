# Client Contact Log

A Trello Power-Up that keeps a record of every contact with the client on the card itself, so that
Comments & activity can stay for the team's internal notes.

Each record has the time, the channel, who initiated the contact, a "logged by" label and a short summary. Card
badges and a board overview show which clients have gone longest without contact.

Version 1.1.1 · English and 简体中文

## Features

- Card back: add, edit and delete contact records; newest first; latest 5 shown, "Show all" for the rest
- Card-front badge: days since the last client contact, red once it passes the limit set in Settings
- Board button "Client contact": cards sorted by longest silence, contacts in the last 7 days, CSV export of every record
- Settings: language, stale-contact days, channels (built-in and your own), lists that are never flagged
- A half-typed record survives a reload of the card section
- Each save is applied to the card's latest data, so a colleague's record added a moment earlier is kept
- Records are shown only to board members with edit access

## Data and privacy

Static front-end files only. There is no server and no database. Records are stored in Trello Power-Up storage
on the user's own board (`card/shared/log`, `board/shared/cfg`, and the user's own `member/private/who`
label). No Trello profile data (name, username, email, avatar) is read or stored. See `privacy.html`.

Trello allows 4096 characters of Power-Up data per card, and counts one Chinese character as one character
(checked on a live board). Measured with this code:

| Summary length | Records per card |
|---|---|
| about 20 Chinese characters | about 80 |
| about 50 Chinese characters | about 50 |
| about 100 Chinese characters | about 32 |
| about 130 English characters | about 24 |

The footer shows space used. From 85% the section warns; when full, a new record is refused (the typed text
is kept). **Archive old records** shows the oldest records as text to copy into the client file, then removes
them from the card after confirmation. The card keeps a count of archived records.

Mobile: Trello's phone apps do not show sections added by Power-Ups.

## Files

| File | Purpose |
|---|---|
| `index.html`, `connector.js` | Trello iframe connector: badges, card-back section, board button, welcome, settings |
| `section.html`, `section.js` | The contact log on the card back |
| `overview.html`, `overview.js` | The board overview modal |
| `settings.html`, `settings.js` | Board settings |
| `welcome.html`, `welcome.js` | Getting-started modal shown when the Power-Up is enabled |
| `shared.js`, `i18n.js`, `ui.css` | Data logic, interface strings (English and Chinese), styles |
| `icon.svg`, `icon-white.svg` | Button icons |
| `privacy.html`, `support.html` | Privacy policy and help page |
| `LISTING.md`, `listing-icon*.png`, `img/` | Copy, icon and images for the Trello directory listing |

Opening `section.html`, `overview.html` or `settings.html` outside Trello shows a demo with fictional data.

## Self-hosting

1. Serve this folder over HTTPS (for example GitHub Pages).
2. https://trello.com/power-ups/admin → **New** → Iframe connector URL: `https://<your-host>/index.html`.
3. **Capabilities**, switch on these six:
   Board buttons · Card back section · Card badges · Card detail badges · On enable · Show settings
4. Board → Power-Ups → Custom → Add.

## Testing

Tested offline against a simulated Trello (data logic, connector, and every page in Chrome), and on a live
board on 17 Nov 2026: the section shows, a record with a Chinese summary saves and deletes, the card badge and
the overview appear, and a 1,899-character (5,381-byte) log saved.

After any change at the connector URL, the new files are live for every user immediately.
