# McKenna & Chandler: wedding website

Static site for our wedding in Sorrento, Italy, 1 October 2027. Plain HTML, CSS and JavaScript, no build step.

## Pages
- `index.html`: save the date, venue photos, "Have a gut feeling?" form, and a hidden schedule
- `travel.html`: flights, getting to Sorrento, where to stay, tips

## Editing
- Names, dates and venue live in `WEDDING` at the top of `assets/js/site.js`. Values in `[brackets]` show as placeholders.
- Set `draft: false` to remove the draft ribbon.
- To add a page, copy an existing page, then add one line to `PAGES` in `assets/js/site.js`.

## Schedule
The schedule lives in `SCHEDULE` in `assets/js/site.js` and stays hidden until `showSchedule` is `true`. Events with `audience: "party"` (rehearsal, rehearsal dinner) only show when `showPartyEvents` is `true`. Hiding them only hides them on the page; anyone reading the source can still see them.

## Gut-feeling replies
Set `replyEndpoint` in `assets/js/site.js` to a form service URL (for example Formspree or a Google Apps Script web app that writes to a Google Sheet). Each reply is POSTed as JSON. With no endpoint the form shows the confirmation but saves nothing.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Hosting
Works on GitHub Pages, Netlify or Cloudflare Pages as is.
