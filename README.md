# Alpha Eve Studios

Responsive creative studio and publisher site for the 2006–2026 anniversary.

## Run locally

Install dependencies with `npm install`, then run `npm run dev`. `npm run build` creates a static build in `dist/`.

## Pages and content

- `/authors` is the creator directory; `/authors/:slug` is a reusable creator portfolio page using the matching image from `artistas/`.
- `/comics` is the comics directory; `/comics/:slug` is a reusable series page with a cover hero, format, genres, synopsis, chapters, covers, characters, gallery and creator credits.
- Project, service, Packito, About and shop destinations have separate routes.

Comic, author and project records are modeled in `seo-data.js`. Creator-to-comic relationships use `creatorSlugs` on comics and `comicSlugs` on creators. The CMS layers D1 overrides on top of those existing records, so unedited content and all current routes remain available.

## Content CMS (Cloudflare D1 + R2)

### Ventas privadas en eventos

En `/admin/ventas` (también enlazado desde el CMS), solo las cuentas con rol `admin` pueden consultar inventarios y registrar ventas tocando una portada y eligiendo efectivo, transferencia, tarjeta o regalo. Administración prepara cada evento con nombre, fecha, efectivo inicial para cambio, unidades llevadas y precios en RD$, incluyendo volúmenes individuales del catálogo. El inventario, historial y cobros se guardan en D1 y requieren conexión. Los regalos descuentan existencias sin sumar ingresos; caja significa efectivo inicial más ventas en efectivo. Los precios se almacenan en centavos y quedan fijados por evento.

Solo administración crea eventos, anula movimientos (restituyendo la unidad) y cierra eventos. Un evento cerrado conserva su historial y no permite nuevas ventas ni anulaciones. Los registros repetidos con el mismo identificador no duplican ventas; la base de datos impide consumir unidades agotadas incluso con varios dispositivos. La sección no tiene enlaces públicos y sus datos requieren una sesión de administrador del CMS. Las cuentas de autores no tienen acceso, tampoco mediante la API.

En **Productos de venta** (`/admin/ventas#productos`) puedes agregar, editar y archivar productos privados con nombre, categoría, precio habitual e imagen (ruta/URL o subida al R2 existente). Se guardan autor y porcentaje como referencia; no se implementó liquidación automática de autores. Archivar un producto lo excluye de nuevos eventos y restaurarlo vuelve a incluirlo. Los eventos anteriores conservan su nombre, precio e inventario aunque se edite o archive el producto.

La migración `0005_sales_products.sql` incorpora 37 productos (32 cómics/ediciones y 5 productos de mercancía) desde `Control de Ventas de Comics.xlsx`, hoja `Control de Ventas`, filas 8–44: nombres, precios, autor y porcentaje. Los productos vinculados al catálogo usan las portadas existentes; los recopilatorios mantienen identidades independientes. No se importan cantidades, ventas, regalos ni cobros históricos. Cada evento comienza con cantidades en cero, que administración introduce manualmente, y puede ajustar los precios de referencia.

Antes de usar esta función en producción, aplica las migraciones pendientes (`0004_event_sales.sql` y `0005_sales_products.sql`) con `pnpm dlx wrangler d1 migrations apply alphaeve-cms --remote` y despliega el sitio.

The private editor is at `/admin`. It supports creating and editing comic, author and project records, restoring the original bundled version, and uploading raster images to R2. It uses the existing record shapes so project case pages, chapter data, credits, galleries, relationship slugs and SEO metadata remain compatible. Public pages, sitemap, canonical/Open Graph metadata and JSON-LD read the merged content.

The studio password remains the administrator login. Administrators can create individual author accounts in **Cuentas de autores**. Each author account can edit that author's profile and comics where the account holder is listed as a work author; contributor credits alone do not grant access. Temporary passwords are shown once, stored as salted PBKDF2 hashes, and must be changed at first login. Authors cannot edit author assignments or delete/reset content. Apply pending D1 migrations before deploying account changes.

### One-time Cloudflare setup

1. Authenticate Wrangler with `pnpm dlx wrangler login`.
2. Create the D1 database and R2 bucket:

   ```powershell
   pnpm dlx wrangler d1 create alphaeve-cms
   pnpm dlx wrangler r2 bucket create alphaeve-cms-media
   ```

3. Copy the returned D1 `database_id` into `wrangler.jsonc`, replacing the local placeholder `00000000-0000-0000-0000-000000000001`.
4. Apply the schema and configure the private login secrets:

   ```powershell
   pnpm dlx wrangler d1 migrations apply alphaeve-cms --remote
   pnpm dlx wrangler secret put CMS_ADMIN_PASSWORD
   pnpm dlx wrangler secret put CMS_SESSION_SECRET
   ```

   Enter a unique, strong CMS password and a separate random session-signing secret of at least 32 characters at the prompts. These values belong in Cloudflare secrets, never in source control.
5. Deploy using the existing `pnpm deploy` script.

For local development, copy `.dev.vars.example` to `.dev.vars`, set local-only values, and run `pnpm cf:dev`. Wrangler uses its local D1 database; initialize it with `pnpm dlx wrangler d1 migrations apply alphaeve-cms --local`.

Records are edited as JSON in `/admin` to retain the existing flexible schema. Existing slugs are immutable so public URLs stay stable. Resetting a bundled record removes only its D1 override and restores the original data; it does not remove the existing route or source record. Newly created records can be removed. R2 uploads are limited to verified JPG, PNG, WebP, GIF and AVIF files up to 10 MB; use the returned `/media/...` URL in the relevant image field.

## Series artwork

Add each main cover as `series/<slug>/cover/cover.jpg`. Chapter based series have individual folders; add each image as `series/<slug>/chapters/chapter-01/cover/cover.jpg`, using the next two digit number for each chapter. The complete slug list and chapter folder map is in [series/README.md](series/README.md).

All existing creator portraits and the official Alpha Eve logo are included. Several series covers are now linked from `series/`, including Baká, Bazuca, Escondite, Jagua Tales, La Armadura de mi Hermano, Más Freak de lo Normal, Pantaleta, Ruptura, Tomorrow Girl x Freakier Than Normal and Yanikeke. Chapter cover art, remaining series covers, project artwork, contact details, the shop destination and Packito's external URL are still to be added.
