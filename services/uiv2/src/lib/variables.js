// Breakpoints in px
const BP_TINY = 450;
const BP_XS = 600;
const BP_TABLET = 768;
const BP_DESKTOP = 960;
const BP_WIDE = 1200;
const BP_EXTRAWIDE = 1400;

export const color = {
  black: '#1a1a1a',
  white: '#fff',
  almostWhite: '#fafafc',
  lightestGrey: '#f5f6fa',
  lightGrey: '#f0f1f5',
  midGrey: '#ebecf0',
  grey: '#a8b4bc',
  darkGrey: '#5f6f7a',
  lagoon2Grey: "#3a3e47",
  green: '#4fda9d',
  lightestBlue: '#6fb3ff',
  linkBlue: '#497ffa',
  lightBlue: '#4c84ff',
  blue: '#4578e6',
  brightBlue: '#2bc0d8',
  lightRed: '#dc3545',
  red: '#c82333',
};

export const bp = {
  tinyOnly: `all and (max-width: ${(BP_TINY - 1) / 16}em)`,
  xs_smallOnly: `all and (max-width: ${(BP_XS - 1) / 16}em)`,
  smallOnly: `all and (max-width: ${(BP_TABLET - 1) / 16}em)`,
  tabletDown: `all and (max-width: ${(BP_DESKTOP - 1) / 16}em)`,
  wideDown: `all and (max-width: ${(BP_WIDE - 1) / 16}em)`,

  tinyUp: `all and (min-width: ${BP_TINY / 16}em)`,
  xs_smallUp: `all and (min-width: ${(BP_XS) / 16}em)`,
  tabletUp: `all and (min-width: ${BP_TABLET / 16}em)`,
  desktopUp: `all and (min-width: ${BP_DESKTOP / 16}em)`,
  wideUp: `all and (min-width: ${BP_WIDE / 16}em)`,
  extraWideUp: `all and (min-width: ${BP_EXTRAWIDE / 16}em)`,

  // Media Queries with both a MIN and a MAX width (for targeting a specific range)
  tiny_tablet: `all and (min-width: ${BP_TINY / 16}em) and (max-width: ${(BP_TABLET - 1) / 16}em)`,
  tiny_wide: `all and (min-width: ${BP_TINY / 16}em) and (max-width: ${(BP_WIDE - 1) / 16}em)`,
  xs_small: `all and (min-width: ${BP_XS / 16}em) and (max-width: ${(BP_TABLET - 1) / 16}em)`,
  tabletOnly: `all and (min-width: ${BP_TABLET / 16}em) and (max-width: ${(BP_DESKTOP - 1) / 16}em)`,
  desktop_wide: `all and (min-width: ${BP_DESKTOP / 16}em) and (max-width: ${(BP_WIDE - 1) / 16}em)`,
  xs_small_extrawide: `all and (min-width: ${BP_XS / 16}em) and (max-width: ${(BP_EXTRAWIDE - 1) / 16}em)`,
  desktop_extrawide: `all and (min-width: ${BP_DESKTOP / 16}em) and (max-width: ${(BP_EXTRAWIDE - 1) / 16}em)`,
  wide_extraWide: `all and (min-width: ${BP_WIDE / 16}em) and (max-width: ${(BP_EXTRAWIDE - 1) / 16}em)`,
};

export const pxToRem = pxValue => `${pxValue / 16}rem`;

export const fontSize = (sizeInPx) => `${pxToRem(sizeInPx)}`;
export const lineHeight = (sizeInPx) => `${pxToRem(sizeInPx * 1.66666667)}`;