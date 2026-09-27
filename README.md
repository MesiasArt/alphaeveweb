# Alpha Eve Studios

Responsive creative studio and publisher website for the 2007–2027 anniversary.

## Run locally

Install dependencies with `npm install`, then run `npm run dev`. `npm run build` creates a static build in `dist/`.

## Content model

Original IP and creator records live in `app.js`. Each creator record uses the artistic name from the matching image filename in `artistas/` and links to a reusable `/authors/:slug` portfolio page. Known comics use `/comics/:slug`; other original properties use `/ip/:slug`. Their reusable detail template includes sections for series information, chapters, art, characters, credits and related creators.

The repository provides the Alpha Eve logo and artist portraits. It does not provide creator roles or biographies, client project details, comic chapter data, shop destinations, Packito's URL or contact details. Those sections are prepared for verified content. The hero and featured-work compositions are CSS art studies, not representations of client commissions. Add confirmed artwork and information before launch.
