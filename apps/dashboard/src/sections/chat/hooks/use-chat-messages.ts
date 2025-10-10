import { useMemo } from 'react';

import { useMessagingControllerGetMessagesV1 } from 'src/api/queries/messaging/messaging';

export function useChatMessages(conversationId: string) {
  const {
    data: messagesData,
    isLoading,
    error,
  } = useMessagingControllerGetMessagesV1(conversationId, undefined, {
    query: { enabled: !!conversationId },
  });

  const messages = useMemo(
    () => messagesData?.data?.messages || [],
    [messagesData?.data?.messages]
  );

  return {
    messages,
    isLoading,
    error,
    totalMessages: messagesData?.pagination?.total || 0,
  };
}
