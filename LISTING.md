# Trello directory listing — Client Contact Log

Power-Up ID: `6afbc51a9774e9c6d48078d4`

## Basic information

| Field | Value |
|---|---|
| Name | Client Contact Log |
| Iframe connector URL | `https://zhijievisa.github.io/client-contact-log/index.html` |
| Author | ZHIJIEVISA PTY LTD |
| Email | info@zhijievisa.com |
| Support contact | info@zhijievisa.com (help page: `https://zhijievisa.github.io/client-contact-log/support.html`) |

## Privacy and compliance

| Field | Value |
|---|---|
| Privacy policy URL | `https://zhijievisa.github.io/client-contact-log/privacy.html` |
| Stores personal data outside Trello? | No. All data is stored in Trello Power-Up storage on the user's board. |

## Listing

**Icon (URL field, 144 × 144 px, HTTPS):** `https://zhijievisa.github.io/client-contact-log/listing-icon-144.png`

**Overview (one line):**

> Log every call, email and meeting with a client on the card, and see which clients you have not contacted lately.

**Images (fictional data, hosted with the Power-Up):**

| Use | URL |
|---|---|
| Animation: adding a record, badge updating | `https://zhijievisa.github.io/client-contact-log/img/demo.gif` |
| Contact log on the card, with card-front badges | `https://zhijievisa.github.io/client-contact-log/img/contact-log.png` |
| Adding a record | `https://zhijievisa.github.io/client-contact-log/img/new-record.png` |
| Board overview | `https://zhijievisa.github.io/client-contact-log/img/overview.png` |

**Description:**

```
Client Contact Log is for anyone who runs client work on Trello cards: lawyers, migration agents, accountants, consultants, agencies, freelancers. It gives each card its own record of contact with the client, separate from Comments, and tells you which clients have not heard from you lately.

![Adding a contact record](https://zhijievisa.github.io/client-contact-log/img/demo.gif)

**The problem it solves**

On a client card, Comments end up doing two jobs. The team uses them to talk to each other, and someone also notes "called the client, they will send the form on Friday". A month later nobody can find what was actually said to the client, or tell when they were last contacted. Client Contact Log gives client contact its own place, so Comments stay for the team.

**How it works**

1. Open a card and click "+ Log a client contact" in the Client contact log section.
2. Pick the channel (phone, email, meeting, WeChat, SMS or your own), who initiated the contact, and write a short summary.
3. Save. The record is added to the card with the time and your name, newest first.

**What you see on the card**

![Contact log on the card](https://zhijievisa.github.io/client-contact-log/img/contact-log.png)

- Every contact with its date and time, channel, direction and who logged it.
- Edit or delete any record.
- A draft you are typing is kept if the card section reloads.
- Two people can log at the same time; a colleague's new record is not overwritten.

**What you see on the board**

- A badge on the front of each card: "Contact today", "Contact 12d ago". It turns red after the number of days you choose.

![Board overview](https://zhijievisa.github.io/client-contact-log/img/overview.png)

- A "Client contact" button that lists every card with a log, longest silence first, with the number of contacts made in the last 7 days.
- CSV export of every record on the board.

**Why use it**

- Know what was said. The history with the client is on the card, in order, not buried in comments.
- Do not leave clients waiting. Cards that have gone quiet turn red and rise to the top of the list.
- Keep internal talk internal. Comments are for the team again.
- Nothing new to learn. It lives on the cards you already use, with no separate login.

**Set up for your practice**

- Choose the channels you use and add your own.
- Set how many days without contact should flag a card, or turn flagging off.
- Mark lists that should never be flagged, such as finished work.
- English and Simplified Chinese.

**Your data stays in Trello**

Everything is stored on your own board using Trello's Power-Up storage. There is no external server, no account to create, no analytics and no tracking. Records are shown only to board members with edit access. Trello stores Power-Up data so that anyone who can view a board can technically read it, so do not use this on public boards.

**Good to know**

- Trello allows about 4,000 characters of Power-Up data per card, which is roughly 30 to 50 records. The section shows the space used. When a card fills up, "Archive old records" lets you copy the oldest records into your own file and remove them from the card.
- Records are typed in by hand. It does not read your email or phone, and it does not send reminders.
- Trello's mobile apps do not show Power-Up sections, so use it in a web browser.
- It is a working log, not a substitute for any client file you are required to keep.
- Free to use.

Help and support: https://zhijievisa.github.io/client-contact-log/support.html
```

**Categories:** choose from what the form offers; closest fits are "Board utilities" and "Communication & collaboration".

## Submission form answers

| Item | Value |
|---|---|
| Connector URL | `https://zhijievisa.github.io/client-contact-log/index.html` |
| Power-Up ID | `6afbc51a9774e9c6d48078d4` |
| Preferred launch date | As soon as approved |

**What it does:**

> Client Contact Log adds a "Client contact log" section to every card. Each record has the time, the channel, who
> initiated the contact, who logged it and a short summary. A card badge shows the days since the last contact and
> turns red after a set number of days. A board button opens an overview of all cards, longest silence first, with
> CSV export.

**How to test:**

> 1. Enable the Power-Up on a board. A short welcome modal opens.
> 2. Open any card and scroll to "Client contact log". Click "+ Log a client contact", choose a channel and
>    "From client" or "To client", type a summary and click "Save record" (or Ctrl+Enter).
> 3. The record appears in the section. Close the card: the card front shows the badge "Contact today".
> 4. Add a second record and set its time to 40 days ago, then delete the first record (✕ twice): the badge
>    shows "Contact 40d ago" in red.
> 5. Click ✎ on a record to edit it. Click "Export" to see the card's records as text. "Archive old records"
>    shows the oldest records as text and removes them from the card after the confirmation box is ticked.
> 6. Click "Client contact" at the top of the board to see the overview and "Export CSV".
> 7. Power-Up Settings: language (English / Simplified Chinese), number of days, channels, lists never flagged.
> No login, test account or third-party service is needed.

**Data and privacy:**

> All data is stored in Trello Power-Up storage (card/shared and board/shared). There is no external server, no
> third-party account, no analytics and no tracking. No personal data is stored outside Trello. An unsaved draft
> is kept in the browser's session storage until it is saved or cancelled.

**Why some viewers see less (if asked about the "shared perspective" guideline):**

> Notes of contact with a client are confidential business information. The badge and the log are therefore shown
> only to signed-in members who can edit the board; observers and public viewers see nothing from this Power-Up.
> This is stated in the welcome modal, the help page and the privacy policy.

## After approval

Any file changed at the connector URL is live for every user immediately. Test changes on a separate copy (a
second custom Power-Up pointing at a staging URL) before replacing the live files.
