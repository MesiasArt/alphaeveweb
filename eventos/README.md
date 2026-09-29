# Eventos

Lista de eventos donde estará Alpha Eve. Se muestra en el home.

1. Pon el banner del lugar en `banners/` (jpg, png o webp).
2. Agrega una entrada en `eventos.json`.

Campos:
- `title` — nombre del evento
- `date` — texto visible (ej. 24–25 oct 2026)
- `place` — ciudad o sede
- `note` — opcional (stand, panel, etc.)
- `banner` — nombre exacto del archivo en `banners/`
- `start` — fecha/hora de inicio para el calendario (`2026-10-24` o `2026-10-24T10:00:00-04:00`)
- `end` — opcional; si es solo fecha, el último día inclusive

Con `start` aparece el botón “Agregar a calendario” (Google Calendar + archivo .ics).

La lista rota sola entre los eventos agregados.
