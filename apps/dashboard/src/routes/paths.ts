import { _id } from 'src/_mock/assets';

const MOCK_ID = _id[1];

// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      updatePassword: `${ROOTS.AUTH}/jwt/update-password`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      overview: `${ROOTS.DASHBOARD}/overview`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      account: (id: string) => `${ROOTS.DASHBOARD}/user/${id}/account`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      demo: { edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit` },
    },
    hostApplications: {
      root: `${ROOTS.DASHBOARD}/host-applications`,
      list: `${ROOTS.DASHBOARD}/host-applications/list`,
      details: (id: string) => `${ROOTS.DASHBOARD}/host-applications/${id}`,
    },
    properties: {
      root: `${ROOTS.DASHBOARD}/properties`,
      list: `${ROOTS.DASHBOARD}/properties/list`,
      new: `${ROOTS.DASHBOARD}/properties/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/properties/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/properties/${id}`,
    },
    invoices: {
      root: `${ROOTS.DASHBOARD}/invoices`,
      new: `${ROOTS.DASHBOARD}/invoices/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/invoices/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/invoices/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/invoices/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/invoices/${MOCK_ID}/edit`,
      },
    },
    bookings: {
      root: `${ROOTS.DASHBOARD}/bookings`,
      list: `${ROOTS.DASHBOARD}/bookings/list`,
      details: (id: string) => `${ROOTS.DASHBOARD}/bookings/${id}`,
    },
    reviews: {
      root: `${ROOTS.DASHBOARD}/reviews`,
      list: `${ROOTS.DASHBOARD}/reviews/list`,
      details: (id: string) => `${ROOTS.DASHBOARD}/reviews/${id}`,
    },
    identityVerification: {
      root: `${ROOTS.DASHBOARD}/identity-verification`,
      list: `${ROOTS.DASHBOARD}/identity-verification/list`,
      details: (id: string) => `${ROOTS.DASHBOARD}/identity-verification/${id}`,
      documentTypes: `${ROOTS.DASHBOARD}/identity-verification/document-types`,
      stats: `${ROOTS.DASHBOARD}/identity-verification/stats`,
    },
    payouts: {
      root: `${ROOTS.DASHBOARD}/payouts`,
      list: `${ROOTS.DASHBOARD}/payouts/list`,
      new: `${ROOTS.DASHBOARD}/payouts/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/payouts/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/payouts/${id}`,
    },
    settings: {
      root: `${ROOTS.DASHBOARD}/settings`,
      configuration: `${ROOTS.DASHBOARD}/settings/configuration`,
    },
    chat: `${ROOTS.DASHBOARD}/chat`,
    catalogs: {
      root: `${ROOTS.DASHBOARD}/catalogs`,
      list: `${ROOTS.DASHBOARD}/catalogs/list`,
      new: `${ROOTS.DASHBOARD}/catalogs/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/catalogs/${id}/edit`,
    },
    splitPayments: {
      root: `${ROOTS.DASHBOARD}/split-payments`,
      list: `${ROOTS.DASHBOARD}/split-payments/list`,
      new: `${ROOTS.DASHBOARD}/split-payments/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/split-payments/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/split-payments/${id}`,
      stats: `${ROOTS.DASHBOARD}/split-payments/stats`,
    },
    taxAdministration: {
      root: `${ROOTS.DASHBOARD}/tax-administration`,
      jurisdictions: {
        root: `${ROOTS.DASHBOARD}/tax-administration/jurisdictions`,
        list: `${ROOTS.DASHBOARD}/tax-administration/jurisdictions/list`,
        new: `${ROOTS.DASHBOARD}/tax-administration/jurisdictions/new`,
        edit: (id: string) => `${ROOTS.DASHBOARD}/tax-administration/jurisdictions/${id}/edit`,
      },
      rates: {
        root: `${ROOTS.DASHBOARD}/tax-administration/rates`,
        list: `${ROOTS.DASHBOARD}/tax-administration/rates/list`,
        new: `${ROOTS.DASHBOARD}/tax-administration/rates/new`,
        edit: (id: string) => `${ROOTS.DASHBOARD}/tax-administration/rates/${id}/edit`,
      },
      reports: {
        root: `${ROOTS.DASHBOARD}/tax-administration/reports`,
        list: `${ROOTS.DASHBOARD}/tax-administration/reports/list`,
      },
      analytics: `${ROOTS.DASHBOARD}/tax-administration/analytics`,
    },
  },
};
