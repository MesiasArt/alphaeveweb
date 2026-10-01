const comics = [
  { title: 'A la deriva con mi perro', slug: 'a-la-deriva-con-mi-perro', initials: 'DERIVA', format: 'One-shot', genres: [], status: null, synopsis: 'Una niña de escasos recursos escapa de casa tras una fuerte discusión de sus padres. Sin más allá donde huir, se echa al mar acompañada de su perro. Juntos terminan a la deriva, donde vivirán una ardua aventura en la delgada línea entre la imaginación y la realidad. La obra trata la realidad que muchos niños son forzados a enfrentar, empujados a tomar decisiones sin la madurez para enfrentarlas.', cover: '/series/a-la-deriva-con-mi-perro/cover/A%20LA%20DERIVA%20CON%20MI%20PERRO%20DEF_001%20cover%20copia.jpg', creatorSlugs: ['tonypan'], creatorCredits: { tonypan: 'Obra completa' }, chapters: [], characters: [], gallery: [] },
  { title: 'Baká: El Mito Asesino', slug: 'baka-el-mito-asesino', initials: 'BAKÁ', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/baka-el-mito-asesino/cover/Baka%20El%20mito%20Asesino%20Vol.1.jpg', creatorSlugs: ['darkereve', 'spencer_draw'], creatorCredits: { darkereve: 'Dibujo', spencer_draw: 'Color' }, chapters: [], characters: [], gallery: [] },
  { title: 'Bazuca - La heroína olvidada', slug: 'bazuca-la-heroina-olvidada', initials: 'BAZUCA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/bazuca-la-heroina-olvidada/cover/Bazuca%20Cover.jpg', creatorSlugs: ['darkereve'], creatorCredits: { darkereve: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'Cuentos del Magijara', slug: 'cuentos-del-magijara', initials: 'MAGIJARA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/cuentos-del-magijara/cover/magijara%20copia.jpg', chapterCount: 5, availableChapters: 5, creatorSlugs: ['zukupow', 'xamurai_rd', 'manuel_shoo', 'darkereve'], creatorCredits: { zukupow: 'Dibujo completo · Portada #4', xamurai_rd: 'Portada #1 (dibujo) · Portada #2', manuel_shoo: 'Portada #1 (color)', darkereve: 'Portada #3' }, externalCredits: ['Portada #5: Enmanuel Everts (colaborador externo)'], chapters: [], characters: [], gallery: [] },
  { title: 'Escondite', slug: 'escondite', initials: 'ESCONDITE', format: null, genres: [], status: null, synopsis: null, cover: '/series/escondite/cover/Escondite.jpg', creatorSlugs: ['nattibie'], creatorCredits: { nattibie: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'How to Hide a Mermaid', slug: 'how-to-hide-a-mermaid', initials: 'MERMAID', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/how-to-hide-a-mermaid/cover/Portada%20Ingles%20y%20Espa%C3%B1ol%20copia.jpg', chapterCount: 2, availableChapters: 2, creatorSlugs: ['froggynami'], creatorCredits: { froggynami: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'Jagua Tales', slug: 'jagua-tales', initials: 'JAGUA', format: null, genres: [], status: null, synopsis: null, cover: '/series/jagua-tales/cover/Jagua%20Tales%20vol2%2001.jpg', creatorSlugs: ['darkereve'], creatorCredits: { darkereve: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'La Armadura de mi Hermano', slug: 'la-armadura-de-mi-hermano', initials: 'ARMADURA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/la-armadura-de-mi-hermano/cover/La%20Armadura.jpg', creatorSlugs: ['manuel_shoo'], creatorCredits: { manuel_shoo: 'Obra' }, externalCredits: ['Portada: Sanefox (colaborador externo)'], chapters: [], characters: [], gallery: [] },
  { title: 'La Guagua Voladora', slug: 'la-guagua-voladora', initials: 'GUAGUA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/la-guagua-voladora/cover/La%20Guagua%20Voladora(1).jpg', creatorSlugs: ['nicodomo', 'mesiasart', 'darkereve'], creatorCredits: { nicodomo: 'Historia / dibujo', mesiasart: 'Lettering · Color de portada', darkereve: 'Dibujo de portada' }, chapters: [], characters: [], gallery: [] },
  { title: 'La Lu’ Interior', slug: 'la-lu-interior', initials: 'LU’', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/la-lu-interior/cover/Portada%20y%20Contraportada%20-%20copia.jpg', creatorSlugs: ['nicodomo', 'heypachy', 'spencer_draw'], creatorCredits: { nicodomo: 'Historia / dibujo', heypachy: 'Tinta', spencer_draw: 'Portada' }, chapters: [], characters: [], gallery: [] },
  { title: 'Last Breath', slug: 'last-breath', initials: 'LAST', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/last-breath/cover/Portada%20y%20Contraportada%20-%20copia.jpg', creatorSlugs: ['spencer_draw'], creatorCredits: { spencer_draw: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'Más Freak de lo Normal', slug: 'mas-freak-de-lo-normal', initials: 'MÁS FREAK', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/mas-freak-de-lo-normal/cover/Copy%20of%20Freakier%20Than%20Normal%20Cover2.jpg', chapterCount: 7, availableChapters: 7, chapterDetails: [
    { number: 1, title: 'Star Game', synopsis: '¿Qué harías si fueras un superhéroe de videojuego? Mia también se lo preguntó y, para su sorpresa, se convirtió en una después de una lluvia de meteoritos. Pero todo héroe tiene sus villanos, y ahora Mia y sus amigos están a punto de embarcarse en la aventura de sus vidas.' },
    { number: 2, title: 'The Call of Duty', synopsis: 'Después de escapar de la nave alienígena, Mia se prepara para usar sus poderes contra el crimen, mientras Jixel intenta mantener todo en secreto para evitar que la situación empeore.' },
    { number: 3, title: 'The Third Strike', synopsis: 'Mia quiere demostrarle a todos que ya es una heroína, pero después de enfrentarse a uno de los alienígenas, pronto se da cuenta de que un héroe se construye con mucho más que superpoderes.' },
    { number: 4, title: 'Frame Trap', synopsis: 'Después de salvar a Mia, nuestro nuevo y misterioso héroe se dirige hacia su verdadero objetivo, revelando la verdad sobre la existencia de los alienígenas y exponiendo lo corrupta que realmente es la agencia ARCOIRIS.' },
    { number: 5, title: 'Foods War', synopsis: 'Mia es capturada y despierta en un mundo nuevo. Guiada por un mensaje de Yoyo, deberá superar diversos desafíos para regresar a su mundo, pero esta vez contará con la ayuda de un nuevo aliado.' },
    { number: 6, title: 'Masks Empire', synopsis: 'Mia es enviada por Yoyo en una misión para rescatar a otras víctimas de los alienígenas en un nuevo mundo lleno de peligros. Allí conoce a un héroe legendario que decide unirse a su causa para rescatar tanto a las víctimas como a la princesa del reino del temible criminal King.' },
    { number: 7, title: 'Guns & Gears', synopsis: 'La ciudad de Prima Donna ha caído bajo el control de la temida banda de forajidos liderada por Rogue Scarlet. Desesperada, Donna busca la ayuda de Mia, quien se une a un grupo de valientes rebeldes para enfrentarse a los bandidos.' },
  ], creatorSlugs: [], creatorCredits: {}, externalCredits: ['Créditos de colaboradores: por detallar'], chapters: [], characters: [], gallery: [] },
  { title: 'Mi Angelito Defectuoso', slug: 'mi-angelito-defectuoso', initials: 'ANGELITO', format: 'Series', genres: [], status: null, synopsis: 'Mikael es un ángel demasiado curioso que se mete en problemas al romper las reglas. Sus preguntas sobre el mundo humano, las aves y el paraíso lo llevan a lugares peligrosos y a descubrir una verdad oculta sobre los ángeles y el lugar donde viven. La obra se presenta como una comedia adorable llena de misterios, confusiones y uno que otro “sanguche”.', cover: '/series/mi-angelito-defectuoso/cover/Portada%20y%20Contraportada%20copia.jpg', chapterCount: 1, availableChapters: 1, creatorSlugs: ['herlyn_sanchez'], creatorCredits: { herlyn_sanchez: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'Pantaleta', slug: 'pantaleta', initials: 'PANTALETA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/pantaleta/cover/Pantaleta.jpg', chapterCount: 2, availableChapters: 2, creatorSlugs: ['nicodomo'], creatorCredits: { nicodomo: 'Obra' }, chapters: [], characters: [], gallery: [] },
  { title: 'Quimica al 100%', slug: 'quimica-al-100', initials: 'QUÍMICA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/quimica-al-100/cover/Baka%20%231%20Portada%20-%20copia.jpg', chapterCount: 3, availableChapters: 3, creatorSlugs: ['jose_cruz', 'yonsoncb', 'spencer_draw'], creatorCredits: { jose_cruz: 'Obra · Portadas #1–#3', yonsoncb: 'Color portada #1', spencer_draw: 'Color portada #2' }, chapters: [], characters: [], gallery: [] },
  { title: 'Ruptura', slug: 'ruptura', initials: 'RUPTURA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/ruptura/cover/Ruptura.jpg', creatorSlugs: ['xamurai_rd', 'mesiasart'], creatorCredits: { xamurai_rd: 'Dibujo', mesiasart: 'Lettering' }, chapters: [], characters: [], gallery: [] },
  { title: 'Sangrienta', slug: 'sangrienta', initials: 'SANGRIENTA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/sangrienta/cover/Baka%20%231%20Portada%20-%20copia.jpg', chapterCount: 3, availableChapters: 1, creatorSlugs: ['mesiasart'], creatorCredits: { mesiasart: 'Portada' }, externalCredits: ['Dibujo: Carlos Reyes del Rosario (colaborador externo)'], chapters: [], characters: [], gallery: [] },
  { title: 'Tomorrow Girl x Freakier Than Normal', slug: 'tomorrow-girl-x-freakier-than-normal', initials: 'TOMORROW', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/tomorrow-girl-x-freakier-than-normal/cover/tomorrow%20girl%20x%20freakier%20than%20normal%20cover.jpg', creatorSlugs: ['spencer_draw'], creatorCredits: { spencer_draw: 'Dibujo completo (portada e interior)' }, externalCredits: ['Escritor: C.J. Hudson'], chapters: [], characters: [], gallery: [] },
  { title: 'Umbral, El reino de lo invisible', slug: 'umbral-el-reino-de-lo-invisible', initials: 'UMBRAL', format: 'One-shot', genres: [], status: null, synopsis: 'El Umbral es el espacio entre lo tangible e intangible, regido por seres incorpóreos y parcialmente inmortales llamados astrales, que mantienen el equilibrio entre ambas realidades. El orden es perturbado cuando aparece “La nada”, y surge el conflicto sobre cómo resolver el problema.', cover: '/series/umbral-el-reino-de-lo-invisible/cover/portada%20umbral%20copia.jpg', creatorSlugs: ['herlyn_sanchez', 'mesiasart'], creatorCredits: { herlyn_sanchez: 'Obra', mesiasart: 'Portada' }, chapters: [], characters: [], gallery: [] },
  { title: 'Yanikeke', slug: 'yanikeke', initials: 'YAN', format: null, genres: [], status: null, synopsis: null, cover: '/series/yanikeke/cover/Yanikeke%2000().jpg', creatorSlugs: ['yonsoncb', 'darkereve'], creatorCredits: { yonsoncb: 'Dibujo · Portada', darkereve: 'Color' }, chapters: [], characters: [], gallery: [] },
];
comics.forEach(comic => {
  if (comic.chapterCount) {
    const chapterDetails = new Map((comic.chapterDetails || []).map(chapter => [chapter.number, chapter]));
    comic.chapters = Array.from({ length: comic.availableChapters }, (_, index) => {
      const number = index + 1;
      const details = chapterDetails.get(number) || {};
      return {
        number,
        title: details.title || `Capítulo ${String(number).padStart(2, '0')}`,
        synopsis: details.synopsis || null,
        status: comic.availableChapters < comic.chapterCount && number === comic.availableChapters ? 'Disponible · habrá más capítulos' : 'Disponible',
        cover: `/series/${comic.slug}/chapters/chapter-${String(number).padStart(2, '0')}/cover/cover.jpg`,
        digitalUrl: null,
        physicalUrl: null,
      };
    });
  }
});
const pantaleta = comics.find(comic => comic.slug === 'pantaleta');
if (pantaleta?.chapters[1]) pantaleta.chapters[1].cover = pantaleta.cover;
const quimica = comics.find(comic => comic.slug === 'quimica-al-100');
if (quimica?.chapters?.length) {
  const quimicaCovers = [
    '/series/quimica-al-100/chapters/chapter-01/cover/Quimica%20al%20100%20Chapter%201%20portada.jpg',
    '/series/quimica-al-100/chapters/chapter-02/cover/Quimica%20al%20100%20Chapter%202%20portada.jpg',
    '/series/quimica-al-100/chapters/chapter-03/cover/Quimica%20al%20100%20Chapter%203%20portada.jpg',
  ];
  quimica.chapters.forEach((chapter, index) => {
    if (quimicaCovers[index]) chapter.cover = quimicaCovers[index];
  });
}
const magijara = comics.find(comic => comic.slug === 'cuentos-del-magijara');
if (magijara?.chapters?.length) {
  const magijaraCovers = {
    1: '/series/cuentos-del-magijara/chapters/chapter-01/cover/Cuentos%20del%20Magijara%20%231%20Cover.jpg',
    2: '/series/cuentos-del-magijara/chapters/chapter-02/cover/Magijara%202%20Portadas.jpg',
    4: '/series/cuentos-del-magijara/chapters/chapter-04/cover/magijara%20portada%20copia%204.jpg',
  };
  magijara.chapters.forEach(chapter => {
    if (magijaraCovers[chapter.number]) chapter.cover = magijaraCovers[chapter.number];
  });
}
const originalIp = [];
const authors = [
  { name: 'Anderson F. Encarnación', slug: 'anderson-07', image: 'anderson-07.jpg', role: 'Anderson-07', social: 'anderson07', bio: null, specialties: [], comicSlugs: [], projectSlugs: ['capitan-avispa'] },
  { name: 'Darwin Núñez', slug: 'darkereve', image: 'darkereve.jpg', role: 'DarkerEve', social: 'darkereve', bio: null, specialties: [], comicSlugs: ['baka-el-mito-asesino', 'bazuca-la-heroina-olvidada', 'cuentos-del-magijara', 'jagua-tales', 'la-guagua-voladora', 'yanikeke'], projectSlugs: ['street-fighter-classic-vol-2', 'drum-battle', 'a-great-and-terrible', 'capitan-avispa'] },
  { name: 'Laura Pérez', slug: 'froggynami', image: 'froggynami.jpg', role: 'Froggynami', social: 'froggynami', bio: null, specialties: [], comicSlugs: ['how-to-hide-a-mermaid'], projectSlugs: [] },
  { name: 'Herlyn Sánchez', slug: 'herlyn_sanchez', image: 'herlyn_sanchez.jpg', role: 'Herlyn Sánchez', social: 'herlyn_sanchez', bio: null, specialties: [], comicSlugs: ['mi-angelito-defectuoso', 'umbral-el-reino-de-lo-invisible'], projectSlugs: [] },
  { name: 'José Cruz', slug: 'jose_cruz', image: 'jose_cruz.jpg', role: 'José Cruz', social: 'jose_cruz', bio: null, specialties: [], comicSlugs: ['quimica-al-100'], projectSlugs: [] },
  { name: 'Manuel Shoo', slug: 'manuel_shoo', image: 'manuel_shoo.jpg', role: 'Manuel Shoo', social: 'manuelshoo', bio: null, specialties: [], comicSlugs: ['cuentos-del-magijara', 'la-armadura-de-mi-hermano'], projectSlugs: [] },
  { name: 'Francisco Balbuena', slug: 'mesiasart', image: 'mesiasart.jpg', role: 'MesiasArt', social: 'mesiasart', bio: null, specialties: [], comicSlugs: ['la-guagua-voladora', 'ruptura', 'sangrienta', 'umbral-el-reino-de-lo-invisible'], projectSlugs: ['un-tesoro-para-siempre', 'comic-con-2025-gafetes', 'drum-battle', 'a-great-and-terrible', 'magikalea-tcg', 'big-empty-blue', 'capitan-avispa'] },
  { name: 'Nathalia Rivera', slug: 'nattibie', image: 'Nattibie.jpg', role: 'Nattibie', social: 'nattibie', bio: null, specialties: [], comicSlugs: ['escondite'], projectSlugs: ['comic-con-2025-gafetes'] },
  { name: 'Nicole Hernández', slug: 'nicodomo', image: 'Nicodomo.jpg', role: 'Nicodomo', social: 'nicodomo', bio: null, specialties: [], comicSlugs: ['la-guagua-voladora', 'la-lu-interior', 'pantaleta'], projectSlugs: [] },
  { name: 'Osvaldo J. Flores', slug: 'ossy_jo', image: 'ossy_jo.jpg', role: 'Ossy Jo', social: 'ossy_jo', bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'Patricia Almonte Brito', slug: 'heypachy', image: 'heypachy.jpg', role: 'HeyPachy', social: 'heypachy', bio: null, specialties: [], comicSlugs: ['la-lu-interior'], projectSlugs: [] },
  { name: 'Spencer Liriano Rafael', slug: 'spencer_draw', image: 'spencer_draw.jpg', role: 'Spencer_Draw', social: 'spencer_draw', bio: null, specialties: [], comicSlugs: ['baka-el-mito-asesino', 'la-lu-interior', 'last-breath', 'quimica-al-100', 'tomorrow-girl-x-freakier-than-normal'], projectSlugs: ['comic-con-2025-gafetes'] },
  { name: 'Tonypan', slug: 'tonypan', image: 'tonypan.jpg', role: 'Tonypan', social: 'tonypan', bio: null, specialties: [], comicSlugs: ['a-la-deriva-con-mi-perro'], projectSlugs: [] },
  { name: 'Máximo Montero', slug: 'xamurai_rd', image: 'xamurai_rd.jpg', role: 'XamuraiRD', social: 'xamurai_rd', bio: null, specialties: [], comicSlugs: ['cuentos-del-magijara', 'ruptura'], projectSlugs: ['un-tesoro-para-siempre', 'comic-con-2025-gafetes', 'hime-animay-crunchyroll'] },
  {
    name: 'Yonson Carbonell',
    slug: 'yonsoncb',
    image: 'yonsoncb.jpg',
    role: 'YonsonCB',
    social: 'yonsoncb',
    bio: 'Soy ilustrador y artista de cómics basado en República Dominicana. Mi trabajo nace del interés por el ambiente, la emoción y la historia. Ya sea a través de la tensión silenciosa de un panel de novela gráfica o de la energía vibrante de una ilustración comercial, uso un trazo firme, colores con textura y composiciones dinámicas para construir mundos que se sienten habitados y personajes que se sienten reales. Siempre estoy emocionado de embarcarme en nuevas aventuras visuales.\n\nHago trabajo freelance desde 2020 y he colaborado con compañías como Lexus, Chestnut Tree Games, Lifeline Comics, Plague Doctor Press, GoalCast, Ko-fi, la embajada de Estados Unidos y más.',
    specialties: ['Ilustración', 'Cómics', 'Narrativa visual'],
    comicSlugs: ['quimica-al-100', 'yanikeke'],
    projectSlugs: ['tren-de-diversion', 'mision-genial', 'comic-con-2025-gafetes', 'magikalea-tcg'],
  },
  { name: 'Diego Colón', slug: 'zukupow', image: 'zukupow.jpg', role: 'Zukupow', social: 'zukupow', bio: null, specialties: [], comicSlugs: ['cuentos-del-magijara'], projectSlugs: ['a-great-and-terrible'] },
];
const projects = [
  {
    title: 'A Great and Terrible #1',
    slug: 'a-great-and-terrible',
    subtitle: 'Sigue el camino de ladrillos rotos',
    client: 'Band of Bards',
    type: 'Cómic / Ilustración',
    storyBy: 'Chris Benamati',
    illustrationBy: 'Dibujo y tinta: Diego Colón · Color y lettering: Francisco Balbuena · Portada: Darwin Núñez · Artes promocionales: Francisco Balbuena',
    themes: ['Cómic', 'Fantasía', 'Kickstarter'],
    category: 'TRABAJOS PARA CLIENTES',
    partner: 'Band of Bards × Alpha Eve',
    headline: 'A GREAT AND<br>TERRIBLE #1',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/a-great-and-terrible',
    creatorSlugs: ['zukupow', 'mesiasart', 'darkereve'],
    clientLogo: '/clientes/BOB-Logo.png',
    logoAlt: 'Band of Bards',
    storyCopy: [
      'Tras una decisión imprudente, Liz es arrojada a un mundo de cuento donde escapar de su pasado significa abrazar su futuro.',
      'Antes de poder soñar con la redención, Liz tiene que sobrevivirse a sí misma…',
      'Liz emprende una aventura Great & Terrible por el camino de ladrillos rotos, con la esperanza de convertirse en una vida que valga la pena salvar.',
      '¿Y si El maravilloso mago de Oz de L. Frank Baum estuviera basado en una familia real, con problemas reales? ¿Y si la familia Gale formara parte de algo más grande?',
      'Liz ha crecido a la sombra de un cuento de hadas tejido con todos esos hilos sueltos, y apenas se sostiene. Este cómic de 30 páginas es un prólogo que explora la vida de Liz en Nueva York y nos da un vistazo de lo que es ser una chica a la que se le acaba el tiempo.',
    ],
    roleCopy: 'Dibujo y tinta: Diego Colón (Zukupow). Color y lettering: Francisco Balbuena (MesiasArt). Portada: Darwin Núñez (DarkerEve). Artes promocionales: Francisco Balbuena (MesiasArt).',
    purposeCopy: 'Próximamente en Kickstarter.',
    closeTitle: 'HISTORIAS CON<br>CARÁCTER',
    closeLine: 'Ilustración y color para cómics que dejan huella.',
    assets: {
      hero: 'A Great and Terrible 2 Promo.jpg',
      story: 'a_great_and_terrible_by_mesiasart_dkp2dgu.jpg',
      gallery: [
        { file: 'A GREAT AND TERRIBLE LOGO copia.png', caption: 'Logo' },
        { file: 'A Great and Terrible 2 Promo.jpg', caption: 'Arte promocional · Francisco Balbuena' },
        { file: 'a_great_and_terrible_by_mesiasart_dkp2dgu.jpg', caption: 'Arte promocional · Francisco Balbuena' },
        { file: 'a great and terrible.png', caption: 'Arte promocional · Francisco Balbuena' },
        { file: 'page 5 copia.jpg', caption: 'Página · Diego Colón / Francisco Balbuena' },
        { file: '67948474fef51086081a3d62caca0c71_original.avif', caption: 'Detalle' },
        { file: 'ba5d8c9fb898d9d93ef604375a69c17f_original.avif', caption: 'Detalle' },
        { file: 'e242cd75b0889c26d8b83682246ace02_original.avif', caption: 'Detalle' },
      ],
    },
  },
  {
    title: 'Un Tesoro para Siempre',
    slug: 'un-tesoro-para-siempre',
    subtitle: 'Una historia para aprender a ahorrar.',
    client: 'Banreservas',
    type: 'Cuento infantil / Ilustración editorial',
    storyBy: 'Evelin Cáceres Castellanos',
    illustrationBy: 'Francisco Balbuena · Máximo Montero',
    themes: ['Educación financiera', 'Ahorro', 'Medio ambiente', 'Valores'],
    category: 'TRABAJOS PARA CLIENTES',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/un-tesoro-para-siempre%20(banreservas)',
    creatorSlugs: ['mesiasart', 'xamurai_rd'],
    assets: {
      hero: 'un tesoro para siempre portada.jpg',
      story: 'Banreservas_cuento_2d5-26 copia.jpg',
      lucasJenny: 'Lucas y Jenny.png',
      jenny: 'Jenny la ballenita.png',
      lucas: 'Lucas.png',
      pages: '17 - 18 Un Tesoro para Siempre.jpg',
      logo: '00 - Editorial Un Tesoro para Siempre LOGO.png',
      launch: 'lanzamiento.webp',
      booth: 'montaje.webp',
    },
  },
  {
    title: 'Tren de Diversión',
    slug: 'tren-de-diversion',
    subtitle: 'Un cuento infantil sobre ciberseguridad.',
    client: 'INDOTEL',
    type: 'Cuento infantil / Ciberseguridad',
    storyBy: 'Anya Damirón',
    illustrationBy: 'Yonson Carbonell',
    themes: ['Ciberseguridad', 'Educación digital', 'Protección al usuario'],
    category: 'TRABAJOS PARA CLIENTES',
    partner: 'INDOTEL × Alpha Eve',
    headline: 'TREN DE<br>DIVERSION',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/el-tren-de-la-diversion',
    creatorSlugs: ['yonsoncb'],
    clientLogo: '/clientes/anya%20damiron.png',
    logoAlt: 'Anya Damirón',
    storyCopy: [
      'El Instituto Dominicano de las Telecomunicaciones (INDOTEL), a través de sus departamentos de Ciberseguridad y Protección al Usuario, demuestra su compromiso con la seguridad digital de las nuevas generaciones al anunciar el lanzamiento de dos cuentos infantiles sobre ciberseguridad: «Pantallas en la Granja» y «Tren de Diversión», de la autora Anya Damirón.',
      'El evento se realizará el lunes 29 de septiembre en la Feria Internacional del Libro Santo Domingo 2025 (FILSD 2025), marcando otro paso hacia una educación digital responsable.',
    ],
    roleCopy: 'Desde Alpha Eve participamos en la creación visual del proyecto, dando forma a un universo ilustrado que acerca la ciberseguridad a niñas y niños a través de la narrativa y el diseño.',
    purposeCopy: 'Tren de Diversión forma parte de una iniciativa de educación digital responsable que busca proteger a las nuevas generaciones con historias claras, cercanas y atractivas.',
    closeTitle: 'HISTORIAS CON<br>PROPÓSITO',
    closeLine: 'Ilustración, narrativa y diseño para crear historias que educan y conectan.',
    assets: {
      hero: 'unnamed.jpg',
      story: 'unnaamed.jpg',
      gallery: [
        { file: 'unnameddad.jpg', caption: 'El tren de la diversión' },
        { file: 'unnadaddamed.jpg', caption: 'Personajes y retos' },
        { file: 'unnadadadadamed.jpg', caption: 'Listos para la aventura' },
        { file: 'unnadadadadadaamed.jpg', caption: 'Dentro del vagón' },
        { file: 'unnaadadadadamed.jpg', caption: 'El paisaje del viaje' },
      ],
    },
  },
  {
    title: 'Misión Genial',
    slug: 'mision-genial',
    subtitle: 'Un reto familiar para volver a la rutina.',
    client: 'Anya Damirón',
    type: 'Juego / Reto familiar',
    storyBy: 'Anya Damirón',
    illustrationBy: 'Yonson Carbonell',
    themes: ['Rutinas', 'Familia', 'Vuelta a clases', 'Juego'],
    category: 'TRABAJOS PARA CLIENTES',
    partner: 'Anya Damirón × Alpha Eve',
    headline: 'MISIÓN<br>GENIAL',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/Mision-Genial',
    creatorSlugs: ['yonsoncb'],
    clientLogo: '/clientes/anya%20damiron.png',
    logoAlt: 'Anya Damirón',
    storyCopy: [
      'Un reto divertido para volver a la rutina mientras disfrutas tiempo en familia.',
      '¡Diviértete con tus hijos mientras se organizan! Crea una rutina en casa durante las primeras semanas de clases con un recurso que les dará una aventura familiar. Incluye 2 afiches, 20 cartas, un libro, personajes nuevos, stickers y muchas canciones que formarán parte de su día a día.',
      'No es un cuento: es una especie de juego o reto, con canciones, sugerencias y personajes nuevos, que invita a los niños a crear su propia rutina para despertar con ganas de marcar las tareas completadas y cumplir desafíos que les ayudarán a hacer amigos y disfrutar más las primeras semanas de clases, tanto en casa como en la escuela.',
      'Incluye un libro que les muestra a los niños cómo completar la Misión Genial, compartiendo experiencias de otras familias, con códigos QR llenos de canciones para el desayuno, la hora del baño y la hora de dormir. También trae dos afiches, 20 cartas, stickers y puntos adhesivos para que tengan todo lo que necesitan.',
    ],
    roleCopy: 'Desde Alpha Eve acompañamos la creación visual del proyecto para que la Misión Genial se sienta clara, jugable y atractiva para toda la familia.',
    purposeCopy: 'Misión Genial ayuda a las familias a organizar las primeras semanas de clases con un reto divertido, canciones y herramientas prácticas para el día a día.',
    closeTitle: 'JUEGO CON<br>PROPÓSITO',
    closeLine: 'Diseño y narrativa para recursos que ayudan a las familias a organizarse jugando.',
    assets: {
      hero: 'unnadddmed.jpg',
      story: 'uaaaannamed.jpg',
      gallery: [
        { file: 'unnaadmed.jpg', caption: 'El libro' },
        { file: 'unnamadadaded.jpg', caption: 'Cartas y producto' },
        { file: 'uaaaadnnamed.jpg', caption: 'En el recreo' },
        { file: 'unnaadadadamed.jpg', caption: 'Rutina y canciones' },
      ],
    },
  },
  {
    title: 'Big Empty Blue',
    slug: 'big-empty-blue',
    subtitle: 'Lettering · Morningtide Studios',
    client: 'Morningtide Studios',
    type: 'Lettering · Cómic',
    storyBy: null,
    illustrationBy: 'Lettering: Francisco Balbuena',
    themes: ['Fantasía', 'Ciencia ficción', 'Lettering', 'Cómic'],
    category: 'TRABAJOS PARA CLIENTES',
    partner: 'Morningtide Studios × Alpha Eve',
    headline: 'BIG EMPTY<br>BLUE',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/Big%20Empty%20Blue',
    creatorSlugs: ['mesiasart'],
    logoAlt: 'Morningtide Studios',
    storyCopy: [
      'Big Empty Blue es una aventura de fantasía y ciencia ficción ambientada en Big Blue, un vasto planeta oceánico habitado por criaturas, culturas y civilizaciones únicas.',
      'El proyecto, desarrollado por Morningtide Studios, combina dos novelas gráficas con una amplia colección de recursos y zines para Dungeons & Dragons, construyendo un universo de más de 400 páginas de contenido original.',
    ],
    roleCopy: 'Para este proyecto, Francisco Balbuena estuvo a cargo del lettering, trabajando la integración visual de los textos, diálogos y elementos gráficos dentro de las páginas del cómic, buscando que la tipografía formara parte de la narrativa y mantuviera la personalidad del mundo creado por Morningtide Studios.',
    purposeCopy: 'Lettering para un universo gráfico de fantasía y ciencia ficción con más de 400 páginas de contenido original.',
    closeTitle: 'TEXTO CON<br>PERSONALIDAD',
    closeLine: 'Lettering que se integra a la narrativa y al mundo del cómic.',
    assets: {
      hero: 'bigemptyblue portada.jpg',
      story: 'BEB_2_Ink_20_Final col copia.jpg',
      gallery: [
        { file: 'bigemptyblue portada.jpg', caption: 'Portada' },
        { file: 'BEB_2_Ink_12 txt copia.jpg', caption: 'Página · Lettering' },
        { file: 'BEB_2_Ink_20_Final col copia.jpg', caption: 'Página a color' },
        { file: 'BEB_2_Ink_23_Finaledit1 copia.jpg', caption: 'Página' },
      ],
    },
  },
  {
    title: 'Hime · #Animay',
    slug: 'hime-animay-crunchyroll',
    subtitle: 'Ilustración para Crunchyroll',
    client: 'Crunchyroll',
    type: 'Ilustración / Character Art',
    storyBy: null,
    illustrationBy: 'Máximo Montero',
    themes: ['Anime', 'Crunchyroll', 'Character Art', 'Animay'],
    category: 'TRABAJOS PARA CLIENTES',
    partner: 'Crunchyroll × Alpha Eve',
    headline: 'HIME<br>#ANIMAY',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/Hime%20%23Animay%20Crunchyroll',
    creatorSlugs: ['xamurai_rd'],
    clientLogo: '/clientes/Crunchyroll-Logo.png',
    logoAlt: 'Crunchyroll',
    storyCopy: [
      'Como parte de #Animay, Máximo Montero fue seleccionado por Crunchyroll para realizar una ilustración de Hime, uno de los personajes asociados a la marca.',
      'El proyecto representó una oportunidad para llevar a una colaboración profesional una de las influencias más importantes en su trayectoria artística: el anime. Desde sus primeras experiencias como espectador hasta convertirse en una parte fundamental de su lenguaje visual, el anime ha influido profundamente en su estilo y en la forma en que desarrolla sus personajes.',
      'A través de esta ilustración, Máximo buscó celebrar esa conexión y aportar su propia interpretación a un personaje que forma parte de la identidad de Crunchyroll.',
    ],
    roleCopy: 'Ilustración de personaje a cargo de Máximo Montero (XamuraiRD) para Crunchyroll · #Animay.',
    purposeCopy: 'Personaje: Hime. Una celebración del anime como lenguaje visual y de la identidad de Crunchyroll.',
    closeTitle: 'ANIME CON<br>IDENTIDAD',
    closeLine: 'Ilustración de personaje para marcas y plataformas globales.',
    assets: {
      hero: 'HIME-ANIMAY_V2_.jpg',
      story: 'crunchyroll 2.jpg',
      gallery: [
        { file: 'HIME-ANIMAY_V2_.jpg', caption: 'Hime · #Animay' },
        { file: 'crunchyroll 2.jpg', caption: 'Ilustración' },
        { file: 'crunchyroll 3.jpg', caption: 'Detalle' },
      ],
    },
  },
  {
    title: 'Capitán Avispa',
    slug: 'capitan-avispa',
    subtitle: 'Storyboard · Película animada',
    client: 'Capitán Avispa',
    type: 'Storyboard',
    storyBy: null,
    illustrationBy: 'Dirección: José Luigi Paredes Marte · Darwin Núñez · Francisco Balbuena · Alexander Méndez · Anderson Feliz Encarnación',
    themes: ['Storyboard', 'Animación', 'Cine'],
    category: 'TRABAJOS PARA CLIENTES',
    partner: 'Capitán Avispa × Alpha Eve',
    headline: 'CAPITÁN<br>AVISPA',
    assetDir: '/datos/proyectos/Trabajos-para-clientes/capitan%20avispa',
    creatorSlugs: ['darkereve', 'mesiasart', 'anderson-07'],
    clientLogo: '/clientes/logo-guerrafilms.png',
    logoAlt: 'Guerra Films',
    storyCopy: [
      'Alpha Eve Studios participó en la producción de Capitán Avispa, película animada creada por Juan Luis Guerra, encargándose del desarrollo de storyboards para la producción.',
      'El departamento estuvo liderado por José Luigi Paredes Marte, junto a Darwin Núñez, Francisco Balbuena, Alexander Méndez y Anderson Feliz Encarnación, quienes aportaron su experiencia en cómic, ilustración y narrativa visual para transformar las escenas del guion en secuencias visuales.',
      'El storyboard fue una parte fundamental del proceso de producción, ayudando a definir composición, puesta en escena, acción, ritmo y narrativa antes de pasar a las etapas de animación.',
      'La película presenta una aventura ambientada en Avispatrópolis y el Reino de la Miel, donde el Capitán Avispa debe enfrentarse a Avispón Jaques Poison para proteger a su comunidad.',
    ],
    roleCopy: 'Dirección del departamento: José Luigi Paredes Marte. Equipo Alpha Eve: Darwin Núñez · Francisco Balbuena · Alexander Méndez · Anderson Feliz Encarnación.',
    purposeCopy: 'Del guion a la pantalla. Storyboard development for Capitán Avispa.',
    closeTitle: 'DEL GUION A<br>LA PANTALLA',
    closeLine: 'Storyboard para cine de animación y producciones de gran escala.',
    assets: {
      hero: 'capitan avispa poster.jpg',
      story: 'PIKENPROJECT_SB-board-00114.png',
      gallery: [
        { file: 'capitan avispa poster.jpg', caption: 'Poster' },
        { file: 'PIKENPROJECT_SB-board-00114.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00115.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00116.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00117.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00118.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00119.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00369.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00370.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00371.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00372.png', caption: 'Storyboard' },
        { file: 'PIKENPROJECT_SB-board-00373.png', caption: 'Storyboard' },
      ],
    },
  },
  {
    title: 'Street Fighter Classic — Vol. 2',
    slug: 'street-fighter-classic-vol-2',
    subtitle: 'Portada oficial · UDON Entertainment × Tora Edizioni',
    client: 'UDON Entertainment',
    type: 'Portada oficial / Ilustración editorial',
    storyBy: null,
    illustrationBy: 'Darwin Núñez',
    themes: ['Street Fighter', 'Portada oficial', 'Videojuegos'],
    category: 'COLABORACIONES',
    partner: 'UDON Entertainment × Tora Edizioni',
    headline: 'STREET FIGHTER<br>CLASSIC',
    assetDir: '/datos/proyectos/Colaboraciones/Street-Fighter-Classic-Cover',
    creatorSlugs: ['darkereve'],
    clientLogo: '/clientes/UDONLogo.webp',
    logoAlt: 'UDON Entertainment',
    storyCopy: [
      'Una oportunidad muy especial para Darwin Núñez, quien fue invitado a realizar una portada oficial para Street Fighter Classic, Vol. 2.',
      'Como fan de Street Fighter desde hace años, Darwin aprovechó la oportunidad para reunir en una misma portada a algunos de sus personajes favoritos de la saga: Ken, Vega, Chun-Li, Sagat y, por supuesto, Cammy.',
      'Un proyecto que permitió llevar una pasión personal al terreno profesional y formar parte de una publicación oficial de una de las franquicias más reconocidas de los videojuegos.',
    ],
    roleCopy: 'Ilustración de portada oficial a cargo de Darwin Núñez (DarkerEve) para UDON Entertainment y Tora Edizioni.',
    purposeCopy: 'Personajes: Ken Masters · Vega · Chun-Li · Cammy White · Sagat. Street Fighter y sus personajes son © Capcom.',
    closeTitle: 'PORTADAS CON<br>IMPACTO',
    closeLine: 'Ilustración oficial para una de las franquicias más icónicas de los videojuegos.',
    assets: {
      hero: 'Street Fighter Classic Cover Full.jpg',
      story: 'Street Fighter Classic Cover Color.jpg',
      gallery: [
        { file: 'Street Fighter Classic Cover Sketch.jpg', caption: 'Boceto' },
        { file: 'Street Fighter Classic Cover Color.jpg', caption: 'Color' },
        { file: 'Street Fighter Classic Cover Full.jpg', caption: 'Portada final' },
      ],
    },
  },
  {
    title: 'Drum Battle',
    slug: 'drum-battle',
    subtitle: 'Storyboard · Corto animado',
    client: 'Marlon West, Head of Effects Animation at Walt Disney Animation Studios.',
    type: 'Storyboard',
    storyBy: null,
    illustrationBy: 'Lápiz: Darwin Núñez · Color: Francisco Balbuena',
    themes: ['Storyboard', 'Animación', 'Corto animado'],
    category: 'COLABORACIONES',
    partner: 'Marlon West × Alpha Eve',
    headline: 'DRUM<br>BATTLE',
    assetDir: '/datos/proyectos/Colaboraciones/drum-battle',
    creatorSlugs: ['darkereve', 'mesiasart'],
    logoAlt: 'Marlon West',
    storyCopy: [
      'Storyboard para el corto animado Drum Battle.',
      'Panel a color de storyboard: lápiz por Darwin Núñez y color por Francisco Balbuena.',
      'Una colaboración con Marlon West, Head of Effects Animation at Walt Disney Animation Studios.',
    ],
    roleCopy: 'Storyboard a lápiz por Darwin Núñez (DarkerEve). Panel a color por Francisco Balbuena (MesiasArt).',
    purposeCopy: 'Cliente: Marlon West — Head of Effects Animation at Walt Disney Animation Studios.',
    closeTitle: 'STORYBOARD CON<br>RITMO',
    closeLine: 'Narrativa visual para cortos animados y colaboraciones creativas.',
    assets: {
      hero: 'Drum Battle p34.jpg',
      story: '46.jpg',
      gallery: [
        { file: 'Drum Battle p34.jpg', caption: 'Panel a color · Lápiz Darwin Núñez · Color Francisco Balbuena' },
        { file: '46.jpg', caption: 'Storyboard' },
        { file: '47.jpg', caption: 'Storyboard' },
        { file: '48.jpg', caption: 'Storyboard' },
        { file: '49.jpg', caption: 'Storyboard' },
        { file: '50.jpg', caption: 'Storyboard' },
        { file: '51.jpg', caption: 'Storyboard' },
        { file: '52.jpg', caption: 'Storyboard' },
        { file: '53.jpg', caption: 'Storyboard' },
        { file: '54.jpg', caption: 'Storyboard' },
      ],
    },
  },
  {
    title: 'Gafetes Comic Con 2025',
    slug: 'comic-con-2025-gafetes',
    subtitle: 'Diseño de gafetes · Comic Con República Dominicana',
    client: 'Comic Con República Dominicana',
    type: 'Diseño de gafetes / Ilustración',
    storyBy: null,
    illustrationBy: 'Spencer Liriano Rafael · Nathalia Rivera · Francisco Balbuena · Yonson Carbonell · Máximo Montero',
    themes: ['Comic Con', 'Gafetes', 'Evento'],
    category: 'COLABORACIONES',
    partner: 'Comic Con República Dominicana × Alpha Eve',
    headline: 'GAFETES<br>COMIC CON',
    assetDir: '/datos/proyectos/Colaboraciones/comic-con-2025-gafetes',
    creatorSlugs: ['spencer_draw', 'nattibie', 'mesiasart', 'yonsoncb', 'xamurai_rd'],
    clientLogo: '/clientes/comic-con-republica-dominicana-2026-logo-trans-blanco.png',
    logoAlt: 'Comic Con República Dominicana',
    storyCopy: [
      'Diseño de gafetes para Comic Con República Dominicana 2025.',
      'La edición 2024 se agregará cuando estén disponibles las imágenes.',
    ],
    roleCopy: 'Desde Alpha Eve participamos en la creación visual de los gafetes del evento.',
    purposeCopy: 'Piezas gráficas para identificación y merchandising del evento.',
    closeTitle: 'EVENTOS CON<br>IDENTIDAD',
    closeLine: 'Ilustración y diseño para experiencias en vivo.',
    assets: {
      hero: 'vegeta comic con3.jpg',
      story: 'Dragon Ball y Miyuki.jpg',
      gallery: [
        { file: 'Comic_Con_destrok_ copia.jpg', caption: 'Gafete' },
        { file: 'Dragon Ball y Miyuki.jpg', caption: 'Dragon Ball' },
        { file: 'Hulk y Anita 1 (2).JPG', caption: 'Hulk' },
        { file: 'LOTR (2).jpg', caption: 'LOTR' },
        { file: 'vegeta comic con3.jpg', caption: 'Vegeta' },
      ],
    },
  },
  {
    title: 'Magikalea TCG',
    slug: 'magikalea-tcg',
    subtitle: 'Trading card game · Propiedad original de Alpha Eve',
    client: 'Alpha Eve Studios',
    type: 'Juego de cartas / TCG',
    storyLabel: 'Creador / Game Design',
    storyBy: 'Francisco Balbuena',
    illustrationLabel: 'Artista principal',
    illustrationBy: 'Yonson Carbonell',
    themes: ['TCG', 'Fantasía', 'Juego de mesa', 'Propiedad original'],
    category: 'VIDEOJUEGOS Y JUEGOS DE MESA',
    categories: ['PROPIEDADES ORIGINALES', 'VIDEOJUEGOS Y JUEGOS DE MESA'],
    partner: 'ALPHA EVE · PROPIEDAD ORIGINAL',
    headline: 'MAGIKALEA<br>TCG',
    assetDir: '/datos/proyectos/Magikalea%20TCG',
    creatorSlugs: ['mesiasart', 'yonsoncb'],
    logoAlt: 'Magikalea TCG',
    storyCopy: [
      'MAGIKALEA es un juego de cartas donde el azar, la estrategia y la lectura del rival se mezclan en partidas rápidas.',
      'Tu objetivo es descubrir el Mago escondido en la mano de tu oponente y golpearlo tres veces. Cada carta puede cambiar el rumbo de la partida: elementos para atacar, trampas para castigar y bendiciones para alterar las reglas.',
    ],
    roleCopy: 'Propiedad original de Alpha Eve Studios: diseño de juego, dirección de arte y desarrollo visual.',
    purposeEyebrow: 'ILUSTRACIÓN',
    purposeTitle: 'ARTISTAS DE<br>TODO EL MUNDO',
    purposeCopy: 'Hay ilustraciones de cartas de artistas de todo el mundo, pero principalmente de ilustradores dominicanos.',
    closeTitle: 'MUNDOS PARA<br>JUGAR',
    closeLine: 'Propiedades originales pensadas para mesa, colección y expansión.',
    externalUrl: 'https://magikalea.alphaeve.net/',
    externalLabel: 'Visitar Magikalea',
    assets: {
      hero: 'Fondo_Inicio.jpg',
      story: 'gameplay.png',
      logo: 'logo.png',
      gallery: [
        { file: 'Fondo_Inicio.jpg', caption: 'Inicio' },
        { file: 'gameplay.png', caption: 'Gameplay' },
        { file: 'arena.png', caption: 'Arena' },
        { file: 'world-bg.png', caption: 'Mundo' },
      ],
    },
  },
];
export { comics, authors, projects, originalIp };

const SITE_NAME = 'Alpha Eve Studios';
const STATIC_PAGES = {
  '/': { title: 'Alpha Eve Studios — Cómics, Manga e Historias', description: 'Estudio creativo y editorial de República Dominicana. Creamos cómics, manga, ilustración, desarrollo visual y mundos originales.' },
  '/services': { title: 'Servicios — Alpha Eve Studios', description: 'Servicios creativos de ilustración, cómics y manga, arte conceptual, diseño y desarrollo visual.' },
  '/projects': { title: 'Proyectos — Alpha Eve Studios', description: 'Explora proyectos de cómics, ilustración, desarrollo visual y colaboraciones creativas de Alpha Eve Studios.' },
  '/comics': { title: 'Cómics — Alpha Eve Studios', description: 'Explora los cómics y mundos originales publicados por Alpha Eve Studios.' },
  '/authors': { title: 'Creadores — Alpha Eve Studios', description: 'Conoce a los artistas y creadores que colaboran en los cómics y proyectos de Alpha Eve Studios.' },
  '/packito': { title: 'Packito — Alpha Eve Studios', description: 'Conoce Packito, la plataforma digital de cómics y manga de Alpha Eve Studios.' },
  '/about': { title: 'Nosotros — Alpha Eve Studios', description: 'Alpha Eve Studios es un estudio creativo y editorial de República Dominicana dedicado a cómics, manga, ilustración y desarrollo visual.' },
  '/historia': { title: 'Nuestra historia — Alpha Eve Studios', description: 'Conoce la historia de Alpha Eve Studios desde sus inicios en 2006.' },
  '/shop': { title: 'Tienda — Alpha Eve Studios', description: 'Información sobre cómics impresos y digitales, láminas y productos de Alpha Eve Studios.', indexable: false },
  '/contacto': { title: 'Contacto — Alpha Eve Studios', description: 'Contacta a Alpha Eve Studios para consultas, colaboraciones y proyectos creativos.' },
};

const absoluteAsset = (origin, value) => value ? new URL(value.startsWith('/') ? value : `/${value}`, origin).href : '';
const cleanText = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const truncate = (value, max = 300) => cleanText(value).slice(0, max);
const automaticTitle = value => {
  const suffix = ` — ${SITE_NAME}`;
  const max = 70;
  const title = cleanText(value);
  return title.length + suffix.length <= max ? `${title}${suffix}` : `${title.slice(0, max - suffix.length - 1).trimEnd()}…${suffix}`;
};

function normalizePath(pathname) {
  let path;
  try { path = decodeURIComponent(pathname); } catch { path = pathname; }
  path = path.replace(/\/+$/, '') || '/';
  return path === '/index.html' ? '/' : path;
}

export function resolvePage(pathname, origin, data = {}) {
  const comicData = data.comics || comics;
  const authorData = data.authors || authors;
  const projectData = data.projects || projects;
  const path = normalizePath(pathname);
  const homeImage = '/banner.jpg';
  if (STATIC_PAGES[path]) return { ...STATIC_PAGES[path], path, image: homeImage, kind: 'website' };
  let match = path.match(/^\/comics\/([^/]+)$/);
  if (match) {
    const comic = comicData.find(item => item.slug === match[1]);
    if (!comic) return null;
    const creators = (comic.creatorSlugs || []).map(slug => authorData.find(author => author.slug === slug)?.name).filter(Boolean);
    const description = comic.synopsis || `${comic.title}: consulta la portada y los créditos${creators.length ? ` de ${creators.join(', ')}` : ''} en el catálogo de Alpha Eve Studios.`;
    return { path, kind: 'creativework', title: automaticTitle(comic.title), description: truncate(description, 160), image: comic.cover || homeImage, comic };
  }
  match = path.match(/^\/authors\/([^/]+)$/);
  if (match) {
    const author = authorData.find(item => item.slug === match[1]);
    if (!author) return null;
    const linkedComics = (author.comicSlugs || []).map(slug => comicData.find(comic => comic.slug === slug)?.title).filter(Boolean);
    const linkedProjects = (author.projectSlugs || []).map(slug => projectData.find(project => project.slug === slug)?.title).filter(Boolean);
    const fallback = [linkedComics.length ? `Cómics: ${linkedComics.join(', ')}.` : '', linkedProjects.length ? `Proyectos: ${linkedProjects.join(', ')}.` : ''].filter(Boolean).join(' ');
    const description = author.bio || (fallback ? `${author.name} es creador de Alpha Eve Studios. ${fallback}` : `Perfil de ${author.name} en el directorio de creadores de Alpha Eve Studios.`);
    const authorImage = author.image && (/^(?:https?:)?\/\//i.test(author.image) || author.image.startsWith('/')) ? author.image : `/artistas/${encodeURIComponent(author.slug)}/perfil.jpg`;
    return { path, kind: 'person', title: automaticTitle(author.name), description: truncate(description, 160), image: authorImage, author };
  }
  match = path.match(/^\/projects\/([^/]+)$/);
  if (match) {
    const project = projectData.find(item => item.slug === match[1]);
    if (!project) return null;
    const description = project.description || project.subtitle || project.storyCopy?.[0] || project.purposeCopy || `${project.title}${project.type ? ` · ${project.type}` : ''}${project.client ? ` · Proyecto para ${project.client}` : ''}.`;
    const hero = project.assets?.hero;
    const projectImage = hero ? (/^(?:https?:)?\/\//i.test(hero) || hero.startsWith('/') ? hero : `${project.assetDir}/${encodeURIComponent(hero)}`) : homeImage;
    return { path, kind: 'creativework', title: automaticTitle(project.title), description: truncate(description, 160), image: projectImage, project };
  }
  return null;
}

export function publicRoutes(data = {}) {
  const comicData = data.comics || comics;
  const authorData = data.authors || authors;
  const projectData = data.projects || projects;
  return [
    ...Object.entries(STATIC_PAGES).filter(([, page]) => page.indexable !== false).map(([path]) => path),
    ...comicData.map(item => `/comics/${item.slug}`),
    ...authorData.map(item => `/authors/${item.slug}`),
    ...projectData.map(item => `/projects/${item.slug}`),
  ];
}

export function pageMetadata(pathname, origin, data = {}) {
  const page = resolvePage(pathname, origin, data);
  if (!page) return null;
  const canonical = new URL(page.path, origin).href;
  const image = absoluteAsset(origin, page.image);
  const breadcrumbs = page.path === '/' ? [] : [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: new URL('/', origin).href },
    { '@type': 'ListItem', position: 2, name: page.title.replace(` — ${SITE_NAME}`, ''), item: canonical },
  ];
  const graph = [
    { '@type': 'Organization', '@id': `${origin}/#organization`, name: SITE_NAME, url: `${origin}/`, logo: absoluteAsset(origin, '/alpha%20eve%20logo.png') },
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: SITE_NAME, url: `${origin}/`, inLanguage: 'es', publisher: { '@id': `${origin}/#organization` } },
  ];
  if (page.kind === 'person') graph.push({ '@type': 'Person', name: page.author.name, image: absoluteAsset(origin, page.image), url: canonical, worksFor: { '@id': `${origin}/#organization` }, ...(page.author.bio ? { description: truncate(page.author.bio) } : {}) });
  if (page.kind === 'creativework') {
    const authorData = data.authors || authors;
    const creators = page.comic ? (page.comic.creatorSlugs || []).map(slug => authorData.find(author => author.slug === slug)?.name).filter(Boolean) : (page.project.creatorSlugs || []).map(slug => authorData.find(author => author.slug === slug)?.name).filter(Boolean);
    const hasPart = (page.comic?.chapters || []).filter(chapter => !['draft','borrador','archived','archivado'].includes(String(chapter.status || 'published').toLowerCase())).map(chapter => {
      const chapterCreators = (chapter.credits || []).map(credit => authorData.find(author => author.slug === credit.creatorSlug)?.name).filter(Boolean);
      const externalCreators = (chapter.externalCredits || []).filter(credit => typeof credit === 'object' && credit.name).map(credit => credit.name);
      const chapterPeople = [...chapterCreators, ...externalCreators];
      return { '@type': 'Chapter', name: chapter.title, position: chapter.number, ...(chapterPeople.length ? { creator: [...new Set(chapterPeople)].map(name => ({ '@type': 'Person', name })) } : {}) };
    });
    graph.push({ '@type': 'CreativeWork', name: page.comic?.title || page.project?.title, url: canonical, image, description: page.description, ...(creators.length ? { creator: creators.map(name => ({ '@type': 'Person', name })) } : {}), ...(hasPart.length ? { hasPart } : {}) });
  }
  if (breadcrumbs.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: breadcrumbs });
  return { ...page, indexable: page.indexable !== false, canonical, image, ogType: page.kind === 'website' ? 'website' : 'article', schema: { '@context': 'https://schema.org', '@graph': graph } };
}
