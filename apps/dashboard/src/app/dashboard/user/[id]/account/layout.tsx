import { AccountLayout } from 'src/sections/account/account-layout';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function Layout({ children, params }: Props) {
  const { id } = await params;
  return <AccountLayout id={id}> {children}</AccountLayout>;
}
