import { useMemo } from 'react';

import { useMessagingAdminControllerGetConversationMessages } from 'src/api/queries/admin/messaging-management/messaging-management';

export function useChatMessages(conversationId: string) {
  const {
    data: messagesData,
    isLoading,
    error,
  } = useMessagingAdminControllerGetConversationMessages(conversationId, undefined, {
    query: { enabled: !!conversationId },
  });

  const messages = useMemo(() => messagesData?.data?.items || [], [messagesData?.data?.items]);

  return {
    messages,
    isLoading,
    error,
    totalMessages: messagesData?.pagination?.total || 0,
  };
}
