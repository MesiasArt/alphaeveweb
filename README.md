# Alpha Eve Studios

Responsive creative studio and publisher site for the 2007–2027 anniversary.

## Run locally

Install dependencies with `npm install`, then run `npm run dev`. `npm run build` creates a static build in `dist/`.

## Pages and content

- `/authors` is the creator directory; `/authors/:slug` is a reusable creator portfolio page using the matching image from `artistas/`.
- `/comics` is the comics directory; `/comics/:slug` is a reusable series page with a cover hero, format, genres, synopsis, chapters, covers, characters, gallery and creator credits.
- Project, service, Packito, About and shop destinations have separate routes.

Series, chapter counts and cover paths are modeled in `app.js`. Creator-to-comic relationships use the `creatorSlugs` field on a comic and `comicSlugs` on a creator. Add confirmed credits to both fields to connect their pages. Genres, synopses, chapter titles, purchase links, creator roles and bios are left unfilled until supplied.

## Series artwork

Add each main cover as `series/<slug>/cover/cover.jpg`. Chapter based series have individual folders; add each image as `series/<slug>/chapters/chapter-01/cover/cover.jpg`, using the next two digit number for each chapter. The complete slug list and chapter folder map is in [series/README.md](series/README.md).

All existing creator portraits and the official Alpha Eve logo are included. Several series covers are now linked from `series/`, including Baká, Bazuca, Escondite, Jagua Tales, La Armadura de mi Hermano, Más Freak de lo Normal, Pantaleta, Ruptura, Tomorrow Girl x Freakier Than Normal and Yanikeke. Chapter cover art, remaining series covers, project artwork, contact details, the shop destination and Packito's external URL are still to be added.
