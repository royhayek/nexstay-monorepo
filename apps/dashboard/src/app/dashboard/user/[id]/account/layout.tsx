'use client';

import { useState, useEffect } from 'react';

import { AccountFormProvider } from 'src/sections/account/account-form-provider';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default function Layout({ params }: Props) {
  const [userId, setUserId] = useState('');
  
  useEffect(() => {
    params.then(({ id }) => setUserId(id));
  }, [params]);
  
  if (!userId) return null;
  
  return <AccountFormProvider id={userId} />;
}
