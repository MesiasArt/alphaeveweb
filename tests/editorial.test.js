import test from 'node:test';
import assert from 'node:assert/strict';
import { comicPreflight, comicReadingState, editorialText, validEditorialLink } from '../editorial.js';
import { pageMetadata } from '../seo-data.js';

const validComic = {
  slug:'publication-check', title:'Publicación de prueba', cover:'/media/cover.jpg',
  catalogType:'Comics', format:'Series', synopsis:'Una historia de prueba.',
  creatorSlugs:['creator'], workAuthorSlugs:['creator'], status:'published',
  chapters:[{id:'chapter-1',number:1,title:'Inicio',cover:'/media/chapter.jpg',status:'published',readUrl:'https://example.com/read',digitalUrl:'https://example.com/buy',physicalUrl:'/shop'}],
};

test('Hooligans without public chapters has no reading target or undefined chapter count', () => {
  const hooligans={slug:'hooligans-our-first-adventure',format:'Series',chapters:[]};
  const state=comicReadingState(hooligans);
  assert.equal(state.hasReadingContent,false);
  assert.equal(state.badge,'SERIE');
  assert.doesNotMatch(state.badge,/undefined|null|NaN/i);
  assert.equal(editorialText(undefined),'');
  assert.equal(editorialText({}),'');
});

test('series counts only public chapters and keeps valid destinations', () => {
  const state=comicReadingState({...validComic,chapterCount:3,chapters:[...validComic.chapters,{id:'chapter-2',number:2,title:'Pendiente',status:'draft'}]});
  assert.equal(state.hasReadingContent,true);
  assert.equal(state.chapters.length,1);
  assert.equal(state.badge,'SERIE · 1 CAPÍTULO · 1 DE 3');
  assert.equal(validEditorialLink(validComic.chapters[0].readUrl),true);
  assert.equal(validEditorialLink(validComic.chapters[0].digitalUrl),true);
  assert.equal(validEditorialLink(validComic.chapters[0].physicalUrl),true);
});

test('preflight distinguishes missing synopsis, empty links and invalid links', () => {
  const noSynopsis=comicPreflight({...validComic,synopsis:'',chapters:[{...validComic.chapters[0],readUrl:'',digitalUrl:null,physicalUrl:''}]});
  assert.equal(noSynopsis.ready,true);
  assert.ok(noSynopsis.warnings.some(message=>message.includes('sinopsis')));
  assert.equal(noSynopsis.errors.length,0);
  const invalid=comicPreflight({...validComic,chapters:[{...validComic.chapters[0],readUrl:'javascript:alert(1)'}]});
  assert.equal(invalid.ready,false);
  assert.ok(invalid.errors.some(message=>message.includes('lectura')));
  assert.equal(validEditorialLink(''),false);
  assert.equal(validEditorialLink('not-a-url'),false);
});

test('missing metadata fields use safe fallback values without inventing editorial copy', () => {
  const comic={slug:'metadata-missing',title:'undefined',cover:null,synopsis:null,chapters:[],creatorSlugs:[]};
  const metadata=pageMetadata('/comics/metadata-missing','https://alphaeve.example',{comics:[comic],authors:[],projects:[]});
  assert.equal(metadata.title,'Alpha Eve Studios');
  assert.ok(metadata.description);
  assert.equal(metadata.canonical,'https://alphaeve.example/comics/metadata-missing');
  assert.doesNotMatch(JSON.stringify(metadata.schema),/undefined|\[object Object\]|NaN/);
});

test('complete publication is ready; different catalog types do not require chapters', () => {
  assert.deepEqual(comicPreflight(validComic),{errors:[],warnings:[],ready:true});
  for (const catalogType of ['Manga','Novelas','Cuentos Infantiles','Artbooks','Otros']) {
    const result=comicPreflight({...validComic,catalogType,format:'One-shot',chapters:[]});
    assert.equal(result.ready,true);
    assert.equal(result.errors.length,0);
  }
});
