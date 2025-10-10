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
    settings: {
      root: `${ROOTS.DASHBOARD}/settings`,
      configuration: `${ROOTS.DASHBOARD}/settings/configuration`,
    },
    amenityCategories: {
      root: `${ROOTS.DASHBOARD}/amenity-categories`,
      list: `${ROOTS.DASHBOARD}/amenity-categories/list`,
      new: `${ROOTS.DASHBOARD}/amenity-categories/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/amenity-categories/${id}/edit`,
    },
    enumDisplays: {
      root: `${ROOTS.DASHBOARD}/enum-displays`,
      list: `${ROOTS.DASHBOARD}/enum-displays/list`,
      new: `${ROOTS.DASHBOARD}/enum-displays/new`,
      edit: (enumName: string, key: string) =>
        `${ROOTS.DASHBOARD}/enum-displays/${enumName}/${key}/edit`,
      enumType: (enumName: string) => `${ROOTS.DASHBOARD}/enum-displays/enum-type/${enumName}`,
    },
    chat: `${ROOTS.DASHBOARD}/chat`,
    catalogs: {
      root: `${ROOTS.DASHBOARD}/catalogs`,
    },
  },
};
