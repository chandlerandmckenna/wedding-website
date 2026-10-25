# McKenna & Chandler: wedding website

Static site for our wedding in Sorrento, Italy, 1 October 2027. Plain HTML, CSS and JavaScript, no build step.

## Pages
- `index.html`: overview and schedule
- `travel.html`: flights, getting to Sorrento, where to stay, tips
- `rsvp.html`: RSVP form

## Editing
- Names, dates, venue and RSVP deadline live in `WEDDING` at the top of `assets/js/site.js`. Values in `[brackets]` show as placeholders.
- Set `draft: false` to remove the draft ribbon.
- To add a page, copy an existing page, then add one line to `PAGES` in `assets/js/site.js`.

## RSVPs
Set `rsvpEndpoint` in `assets/js/site.js` to a form service URL (for example Formspree or a Google Apps Script web app that writes to a Google Sheet). Each reply is POSTed as JSON. With no endpoint the form shows the confirmation but saves nothing.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Hosting
Works on GitHub Pages, Netlify or Cloudflare Pages as is.
