// Breakpoints in px
const BP_TINY = 350;
const BP_XS = 450;
const BP_TABLET = 668;
const BP_DESKTOP = 960;
const BP_WIDE = 1200;
const BP_EXTRAWIDE = 1400;

export const color = {
  white: '#fff',
  lightGrey: '#efefef',
  midGrey: '#d1d1d1',
  grey: '#999',
};

export const bp = {
  xs_smallOnly: `all and (max-width: ${(BP_XS - 1) / 16}em)`,
  smallOnly: `all and (max-width: ${(BP_TABLET - 1) / 16}em)`,
  tabletDown: `all and (max-width: ${(BP_DESKTOP - 1) / 16}em)`,

  tinyUp: `all and (min-width: ${BP_TINY / 16}em)`,
  xs_smallUp: `all and (min-width: ${(BP_XS) / 16}em)`,
  tabletUp: `all and (min-width: ${BP_TABLET / 16}em)`,
  desktopUp: `all and (min-width: ${BP_DESKTOP / 16}em)`,
  wideUp: `all and (min-width: ${BP_WIDE / 16}em)`,
  extraWideUp: `all and (min-width: ${BP_EXTRAWIDE / 16}em)`,

  // Media Queries with both a MIN and a MAX width (for targeting a specific range)
  tiny_tablet: `all and (min-width: ${BP_TINY / 16}em) and (max-width: ${(BP_TABLET - 1) / 16}em)`,
  xs_small: `all and (min-width: ${BP_XS / 16}em) and (max-width: ${(BP_TABLET - 1) / 16}em)`,
  tabletOnly: `all and (min-width: ${BP_TABLET / 16}em) and (max-width: ${(BP_DESKTOP - 1) / 16}em)`,
  desktop_wide: `all and (min-width: ${BP_DESKTOP / 16}em) and (max-width: ${(BP_WIDE - 1) / 16}em)`,
  wide_extraWide: `all and (min-width: ${BP_WIDE / 16}em) and (max-width: ${(BP_EXTRAWIDE - 1) / 16}em)`,
};
