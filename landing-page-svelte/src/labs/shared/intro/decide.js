// Whether the labs' cockpit intro should play. Pure so Node checks can cover every case.
// seen: the stored flag ('1'), null when never shown, undefined when storage is unavailable (private mode).

/** @param {{force?: boolean, param?: string|null, seen?: string|null, reducedMotion?: boolean}} o */
export function shouldPlay({ force = false, param = null, seen, reducedMotion = false }) {
  if (param === '0') return false;
  if (force || param === '1') return true;
  if (seen !== null) return false;
  return !reducedMotion;
}
