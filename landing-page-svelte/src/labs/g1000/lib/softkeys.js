// Softkey rows of both GDUs (12 keys each, index 0..11 left to right) for every menu level, and their on/off
// annunciation. Labels the course does not simulate are still drawn; pressing them shows "not available".

export const MENUS = {
  pfd: {
    root: [null, 'INSET', null, 'PFD', 'OBS', 'CDI', 'DME', 'XPDR', 'IDENT', 'TMR/REF', 'NRST', 'ALERTS'],
    inset: ['OFF', 'DCLTR', null, 'TRAFFIC', 'TOPO', 'TERRAIN', 'STRMSCP', 'NEXRAD', 'XM LTNG', null, 'BACK', null],
    pfd: [null, 'DFLT PFD', null, 'WIND', 'DME', 'BRG1', 'HSI FRMT', 'BRG2', null, 'ALT UNIT', 'STD BARO', 'BACK'],
    xpdr: [null, null, 'STBY', 'ON', 'ALT', null, 'VFR', 'CODE', 'IDENT', null, 'BACK', null],
    code: ['0', '1', '2', '3', '4', '5', '6', '7', 'IDENT', 'BKSP', 'BACK', null],
  },
  mfd: {
    root: [null, null, null, null, 'ENGINE', null, 'MAP', null, null, null, 'DCLTR', 'SHW CHRT'],
    map: ['TRAFFIC', 'PROFILE', 'TOPO', 'TERRAIN', 'STRMSCP', 'NEXRAD', 'XM LTNG', null, null, null, 'BACK', null],
    engine: [null, 'ENGINE', 'LEAN', 'SYSTEM', null, null, null, null, null, null, 'BACK', null],
  },
};

/** Labels the course simulates, as `${gdu}:${menu}:${label}`; digits of the code menu are handled as a group. */
export const SUPPORTED = new Set([
  'pfd:root:INSET', 'pfd:root:PFD', 'pfd:root:OBS', 'pfd:root:CDI', 'pfd:root:XPDR', 'pfd:root:IDENT', 'pfd:root:TMR/REF', 'pfd:root:NRST',
  'pfd:inset:OFF', 'pfd:inset:BACK',
  'pfd:pfd:BRG1', 'pfd:pfd:BRG2', 'pfd:pfd:STD BARO', 'pfd:pfd:BACK',
  'pfd:xpdr:STBY', 'pfd:xpdr:ON', 'pfd:xpdr:ALT', 'pfd:xpdr:VFR', 'pfd:xpdr:CODE', 'pfd:xpdr:IDENT', 'pfd:xpdr:BACK',
  'pfd:code:IDENT', 'pfd:code:BKSP', 'pfd:code:BACK',
  'mfd:root:ENGINE', 'mfd:root:MAP', 'mfd:root:DCLTR',
  'mfd:map:TOPO', 'mfd:map:BACK',
  'mfd:engine:ENGINE', 'mfd:engine:LEAN', 'mfd:engine:SYSTEM', 'mfd:engine:BACK',
]);

/**
 * What a GDU's softkey row shows now.
 * @param {'pfd'|'mfd'} gdu
 * @returns {{ label: string|null, on: boolean }[]}
 */
export function softkeys(s, gdu) {
  const menu = s[gdu].menu;
  return MENUS[gdu][menu].map((label) => {
    if (!label) return { label: null, on: false };
    const on =
      (gdu === 'pfd' && ((label === 'INSET' && s.pfd.inset) || (label === 'OBS' && s.pfd.obs) ||
        (label === 'BRG1' && s.pfd.brg1 !== 'off') || (label === 'BRG2' && s.pfd.brg2 !== 'off') ||
        (menu === 'xpdr' && label === s.xpdr.mode) || (label === 'TMR/REF' && s.pfd.win === 'tmr') ||
        (label === 'NRST' && s.pfd.win === 'nrst'))) ||
      (gdu === 'mfd' && ((label === 'TOPO' && s.mfd.topo) || (menu === 'engine' && label === s.mfd.eis) ||
        (label === 'DCLTR' && s.mfd.dcltr > 0)));
    return { label: label === 'DCLTR' && s.mfd.dcltr > 0 ? `DCLTR-${s.mfd.dcltr}` : label, on };
  });
}
