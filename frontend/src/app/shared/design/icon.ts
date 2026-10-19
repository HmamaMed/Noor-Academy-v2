import { Component, input } from '@angular/core';

const paths: Record<string, string> = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  book: 'M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1m0-15c3-2 7-2 10-1v15c-3-1-7-1-10 1V5',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm2-3v6m10-6v6M3 11h18m-14 4h2m4 0h2',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2H4Z',
  users: 'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 21v-3a6 6 0 0 1 12 0v3M4 5a3 3 0 0 0 0 6m16-6a3 3 0 0 1 0 6M2 20v-4a4 4 0 0 1 3-4m17 8v-4a4 4 0 0 0-3-4',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3V10Z',
  file: 'M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8m-8 4h8',
  link: 'm10 13 4-4m-7 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v1',
  logout: 'M9 3H3v18h6m5-15 6 6-6 6m-7-6h13',
  room: 'M4 21V3h12v18M2 21h20m-6-14h4v14M12 11v2',
  lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 5v2',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  plus: 'M12 4v16M4 12h16',
  quote: 'M10 5H4v7h5c0 3-1 5-4 7m15-14h-6v7h5c0 3-1 5-4 7',
  mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
  phone: 'M8 3H4a1 1 0 0 0-1 1c0 10 7 17 17 17a1 1 0 0 0 1-1v-4l-5-2-2 3a15 15 0 0 1-7-7l3-2-2-5Z',
  send: 'm21 3-7 18-4-7-7-4L21 3Zm0 0L10 14',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1-5h.01',
  facebook: 'M14 21v-8h3l.5-4H14V7c0-1 .5-1.5 1.5-1.5H18V2.2L15 2c-3 0-5 2-5 5v2H7v4h3v8',
  whatsapp: 'M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5ZM8 7l2 3-1 1a9 9 0 0 0 4 4l1-1 3 2c-1 2-3 2-5 1-3-1-5-3-6-6-1-2-1-3 2-4Z',
};
@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>`,
  styles: [':host { display: inline-flex; width: 1.5rem; height: 1.5rem; flex: 0 0 auto; vertical-align: middle; } svg { width: 100%; height: 100%; }'],
})
export class Icon { name = input('book'); protected path() { return paths[this.name()] ?? paths['book']; } }
