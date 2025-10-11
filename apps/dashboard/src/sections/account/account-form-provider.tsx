'use client';

import { useState } from 'react';

import { AccountLayout } from './account-layout';
import { AccountGeneral } from './account-general';
import { AccountNotifications } from './account-notifications';
import { AccountBookingsView } from './view/account-bookings-view';

type Props = {
  id: string;
};

export function AccountFormProvider({ id }: Props) {
  const [activeTab, setActiveTab] = useState('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <AccountBookingsView id={id} />;
      // case 'billing':
      //   return (
      //     <AccountBilling
      //       plans={_userPlans}
      //       cards={_userPayment}
      //       invoices={_userInvoices}
      //       addressBook={_userAddressBook}
      //     />
      //   );
      case 'notifications':
        return <AccountNotifications id={id} />;
      // case 'socials':
      //   return <AccountSocials socialLinks={_userAbout.socialLinks} />;
      // case 'security':
      //   return <AccountChangePassword />;
      default:
        return <AccountGeneral id={id} />;
    }
  };

  return (
    <AccountLayout id={id} activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </AccountLayout>
  );
}
