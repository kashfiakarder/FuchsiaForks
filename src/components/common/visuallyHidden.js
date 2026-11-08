/**
 * Hide from sight, keep for assistive tech.
 *
 * Worth having in one place: MUI's `sx` treats a bare `width: 1` as `100%`,
 * not `1px`, so the usual hand-rolled clip trick silently produces a
 * full-width element and blows out the page. These are explicit pixels.
 */
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
