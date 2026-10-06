import { Component } from '@angular/core';

/** Abstract brand artwork: no real academy premises or sacred text are depicted. */
@Component({
 selector: 'app-learning-art',
 template: `<svg viewBox="0 0 540 480" fill="none" aria-hidden="true">
  <path fill="#EFE8D8" d="M0 0h540v480H0z"/>
  <path fill="#F7F5EF" d="M254 394V147a126 126 0 0 1 252 0v247H254Z"/>
  <circle cx="380" cy="151" r="64" fill="#B58A43"/>
  <path d="M0 397 540 318v162H0V397Z" fill="#DDD2BC"/>
  <path d="M254 365V244c104-23 179-37 252-74v171l-252 24Z" fill="#E8DECA"/>
  <path d="m282 333 211-16v32l-211 20v-36Z" fill="#163D35"/>
  <path d="m300 339 184-15v18l-184 18v-21Z" fill="#E7DDC6"/>
  <path d="m272 299 204-7v31l-204 17v-41Z" fill="#78867E"/>
  <path d="m290 306 177-6v17l-177 15v-26Z" fill="#F7F5EF"/>
  <path d="m287 268 175-1v26l-175 8v-33Z" fill="#163D35"/>
  <path d="m304 274 149-1v14l-149 7v-20Z" fill="#DDD2BC"/>
  <path d="M141 342c-29-8-45-28-28-48 4-5 7-14 8-23h31c0 11 2 18 7 25 15 22 7 40-18 46Z" fill="#F7F5EF"/>
  <path d="M137 273c3-38 12-84 42-126m-36 96c-23-10-33-25-39-48m44 26c22-9 40-28 49-46m-40 22c-4-23-4-33 0-49" stroke="#52635B" stroke-width="2"/>
  <path d="M174 156c-6-15-1-28 15-40 0 19-4 31-15 40Zm-17 35c-14-8-19-19-17-36 13 9 19 21 17 36Zm-17 50c-18-2-29-12-35-28 21 2 32 12 35 28Zm22-37c2-19 12-29 30-32-5 18-14 28-30 32Zm-40 22c-18-8-26-18-25-36 16 9 25 19 25 36Zm24 5c7-17 19-25 36-24-10 17-22 25-36 24Z" fill="#71816A"/>
  <path d="m54 404 134-55c32-8 64-2 94 22 33-33 69-47 109-39l102 47-189 65-250-40Z" fill="#163D35"/>
  <path d="m62 396 127-56c37-5 67 8 93 27 35-34 67-40 102-34l98 39-181 62-239-38Z" fill="#E7DDC6"/>
  <path d="m74 384 116-65c37-5 69 19 92 46 29-37 62-57 95-45l95 38-177 64-221-38Z" fill="#F7F5EF"/>
  <path d="m282 365 13 57m-174-49 81-40c23 0 43 11 58 22m-131 27 75-34c23 0 37 6 56 17m52-12c23-22 42-25 57-21l55 20m-108 10c24-20 41-19 60-13l42 15" stroke="#D7CCB7" stroke-width="2"/>
  <path d="m54 404 246 40 193-65" stroke="#B58A43" stroke-width="2"/>
 </svg>`,
 styles: [':host { display: block; } svg { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: var(--noor-radius-feature); }'],
})
export class LearningArt {}
