import type { NavigationMenu } from '../types';
import { siteCopy } from '../copy/pages/site';

/**
 * The built-in menus: they seed the CMS (`site_navigation`) and are what the site shows while a record is
 * missing or still a draft. The header default is read from the shipped site copy, so it is exactly the menu
 * that was live before the menu became editable.
 */
const copy = siteCopy.defaults as Record<string, string>;

function headerItems(): NavigationMenu['items'] {
  const items: NavigationMenu['items'] = [];
  for (let i = 0; copy[`header.nav.${i}.href`]; i += 1) {
    items.push({ label: copy[`header.nav.${i}.label`] ?? '', href: copy[`header.nav.${i}.href`]! });
  }
  return items;
}

export const navigationDefaults: NavigationMenu[] = [
  {
    id: 'header',
    title: 'Header menu',
    description: 'The links in the site header and its slide-out menu. The first four also appear in the desktop bar.',
    items: headerItems(),
  },
];
