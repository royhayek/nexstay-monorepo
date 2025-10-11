import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js router (legacy)
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock paths
jest.mock('src/routes/paths', () => ({
  paths: {
    dashboard: {
      root: '/dashboard',
      properties: {
        root: '/dashboard/properties',
        new: '/dashboard/properties/new',
        details: (id) => `/dashboard/properties/${id}`,
        edit: (id) => `/dashboard/properties/${id}/edit`,
      },
      bookings: {
        root: '/dashboard/bookings',
        details: (id) => `/dashboard/bookings/${id}`,
      },
    },
  },
}))

// Mock locales
jest.mock('src/locales', () => ({
  useTranslate: () => (key) => key,
  useLocales: () => ({
    currentLang: { value: 'en', label: 'English' },
    allLangs: [{ value: 'en', label: 'English' }],
    onChangeLang: jest.fn(),
  }),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
})

// Mock MUI theme provider if needed
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      error: { main: '#f44336' },
      warning: { main: '#ff9800' },
      info: { main: '#2196f3' },
      success: { main: '#4caf50' },
    },
    breakpoints: {
      up: () => '',
      down: () => '',
      between: () => '',
      only: () => '',
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  }),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    a: 'a',
    img: 'img',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}))

// Suppress console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: React.createFactory() is deprecated') ||
        args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})