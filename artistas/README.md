# Fotos de creadores

Cada creador tiene su propia carpeta, usando el mismo slug que en el sitio:

```
artistas/
  darkereve/
    perfil.jpg
    galeria/
      cualquier-imagen.jpg
```

- `perfil.jpg` (o `.png` / `.webp`) es la foto de perfil.
- Todo lo que pongas dentro de `galeria/` aparece en la galería del perfil.
- Cuando agregues o quites imágenes, corre `npm run build` (o `npm run deploy`) para actualizar el listado.

No cambies el nombre de la carpeta del creador.
