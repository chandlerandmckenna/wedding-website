# McKenna & Chandler: wedding website

Static site for our wedding in Sorrento, Italy, October 1, 2027. Plain HTML, CSS and JavaScript, no build step.

## Pages
- `index.html`: the cover (phone sign-in), then the save the date, venue and "Have a gut feeling?" buttons. A schedule section stays hidden until it's switched on.
- `travel.html`: flights, getting to Sorrento, where to stay, tips. Guests must sign in first.

## Editing
- Names, dates and venue live in `WEDDING` at the top of `assets/js/site.js`.
- To add a page, copy an existing page, then add one line to `PAGES` in `assets/js/site.js`.

## Guest sign-in and answers
Guests sign in with their US phone number (formatted as they type), or with their email if the number does not work. A known guest opens the site straight away; anyone new is asked once for name and email. The signed-in guest is remembered on their device, so the later RSVP can be pre-filled.

The guest list and answers live in a Google Sheet behind a Google Apps Script web app: see `backend/apps-script.gs` for the sheet layout and deploy steps, then set `apiEndpoint` in `assets/js/site.js`. With no endpoint the site runs in preview mode: any number works and everything stays in that browser.

There's no text-message code, so anyone who knows a guest's number could sign in as them. That's the usual trade-off for wedding sites; adding SMS codes would need a paid service like Twilio.

## Schedule
Public events are in `SCHEDULE` in `assets/js/site.js`; set `showSchedule: true` to show them. Private events (rehearsal, rehearsal dinner) go in the sheet's "Private events" tab and are only sent to guests whose Group matches, so they never appear in the site's code.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Hosting
Works on GitHub Pages, Netlify or Cloudflare Pages as is.
