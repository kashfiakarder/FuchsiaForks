import { createTheme, alpha } from '@mui/material/styles';

/**
 * Fuchsia design tokens.
 *
 * The brand is one saturated magenta against a near-white page. Because the
 * accent is so strong, it is rationed: it marks the primary action, the
 * active nav item and links, and nothing else. Everything structural is
 * grey, which is what keeps the magenta meaning something.
 */
export const BRAND = {
  magenta: '#C800B9',
  magentaDark: '#9E0092',
  magentaSoft: '#FBEAF8',
  magentaBorder: '#F0C9EA',
  ink: '#121214',
  inkSoft: '#3F4045',
  grey: '#64656C',
  greyLight: '#8A8B93',
  line: '#E7E7EC',
  page: '#F4F4F6',
  paper: '#FFFFFF',
  green: '#2F5D3A',
  greenSoft: '#EEF5EF',
};

/** Shared radii, so cards, inputs and chips stay in the same family. */
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: BRAND.magenta,
      dark: BRAND.magentaDark,
      light: BRAND.magentaSoft,
      contrastText: '#FFFFFF',
    },
    secondary: { main: BRAND.ink },
    success: { main: BRAND.green, light: BRAND.greenSoft },
    error: { main: '#C62828' },
    background: { default: BRAND.page, paper: BRAND.paper },
    text: { primary: BRAND.ink, secondary: BRAND.grey, disabled: BRAND.greyLight },
    divider: BRAND.line,
  },

  shape: { borderRadius: RADIUS.md },

  typography: {
    fontFamily: "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    // The mockups set headings tight and heavy; body stays comfortable.
    h1: { fontSize: '2.35rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 },
    h2: { fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.022em', lineHeight: 1.15 },
    h3: { fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25 },
    h4: { fontSize: '1.08rem', fontWeight: 700, letterSpacing: '-0.012em', lineHeight: 1.3 },
    h5: { fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.008em' },
    h6: { fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.005em' },
    subtitle1: { fontSize: '0.95rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.84rem', fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    caption: { fontSize: '0.78rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    /** Tiny tracked-out label used above page titles and on chips. */
    overline: {
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      lineHeight: 1.6,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': { height: '100%' },
        body: {
          backgroundColor: BRAND.page,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*': { WebkitTapHighlightColor: 'transparent' },
        // One visible focus ring for the whole app, rather than letting each
        // component invent its own.
        ':focus-visible': {
          outline: `2px solid ${BRAND.ink}`,
          outlineOffset: 2,
          borderRadius: 6,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: BRAND.line },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIUS.sm,
          paddingInline: 18,
          minHeight: 42,
          whiteSpace: 'nowrap',
        },
        sizeLarge: { minHeight: 50, fontSize: '0.98rem', paddingInline: 24 },
        sizeSmall: { minHeight: 34, fontSize: '0.84rem', paddingInline: 12 },
        containedPrimary: {
          '&:hover': { backgroundColor: BRAND.magentaDark },
        },
        outlined: {
          borderColor: BRAND.line,
          color: BRAND.ink,
          backgroundColor: BRAND.paper,
          '&:hover': { borderColor: '#D5D5DC', backgroundColor: '#FAFAFC' },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.sm,
          backgroundColor: BRAND.paper,
          '& fieldset': { borderColor: BRAND.line },
          '&:hover fieldset': { borderColor: '#D5D5DC' },
          '&.Mui-focused fieldset': { borderWidth: 1.5, borderColor: BRAND.magenta },
        },
        input: { paddingBlock: 13 },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.86rem', fontWeight: 600, color: BRAND.ink },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: RADIUS.pill },
        outlined: { borderColor: BRAND.line, backgroundColor: BRAND.paper },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          minHeight: 44,
          paddingInline: 4,
          marginRight: 24,
          minWidth: 0,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: BRAND.ink, fontSize: '0.75rem', borderRadius: 6 },
      },
    },

    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: { root: { fontWeight: 600 } },
    },

    MuiAvatar: {
      styleOverrides: { root: { fontSize: '0.78rem', fontWeight: 700 } },
    },

    MuiDialog: {
      styleOverrides: { paper: { borderRadius: RADIUS.lg } },
    },
  },
});

/** Card surface used by nearly every panel in the app. */
export const cardSx = {
  bgcolor: 'background.paper',
  border: `1px solid ${BRAND.line}`,
  borderRadius: `${RADIUS.lg}px`,
};

/** A tinted information panel — magenta for brand notes, green for guidance. */
export const tintSx = (tone = 'magenta') => ({
  bgcolor: tone === 'green' ? BRAND.greenSoft : BRAND.magentaSoft,
  border: `1px solid ${tone === 'green' ? alpha(BRAND.green, 0.14) : BRAND.magentaBorder}`,
  borderRadius: `${RADIUS.lg}px`,
});

export default theme;
