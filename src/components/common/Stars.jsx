import Box from '@mui/material/Box';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import { visuallyHidden } from './visuallyHidden';

/**
 * A read-only star rating.
 *
 * The value is also written out for assistive tech — five magenta glyphs
 * convey nothing to a screen reader on their own.
 */
export default function Stars({ value, size = 18, label }) {
  const rounded = Math.round(value);
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}>
      <Box component="span" sx={{ display: 'inline-flex' }} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) =>
          n <= rounded ? (
            <StarRoundedIcon key={n} sx={{ fontSize: size, color: 'primary.main' }} />
          ) : (
            <StarOutlineRoundedIcon key={n} sx={{ fontSize: size, color: 'divider' }} />
          ),
        )}
      </Box>
      <Box component="span" sx={visuallyHidden}>
        {label ?? `${value} out of 5`}
      </Box>
    </Box>
  );
}
