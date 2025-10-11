import type { SWRConfiguration } from 'swr';
import type {
  MessageDataDto,
  ConversationDataDto,
  ConversationParticipantDto,
} from 'src/api/models/admin';

import useSWR from 'swr';
import { useMemo } from 'react';
import { keyBy } from 'es-toolkit';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const enableServer = false;

const CHAT_ENDPOINT = endpoints.chat;

const swrOptions: SWRConfiguration = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

type ContactsData = {
  contacts: ConversationParticipantDto[];
};

export function useGetContacts() {
  const url = [CHAT_ENDPOINT, { params: { endpoint: 'contacts' } }];

  const { data, isLoading, error, isValidating } = useSWR<ContactsData>(url, fetcher, {
    ...swrOptions,
  });

  const memoizedValue = useMemo(
    () => ({
      contacts: data?.contacts || [],
      contactsLoading: isLoading,
      contactsError: error,
      contactsValidating: isValidating,
      contactsEmpty: !isLoading && !isValidating && !data?.contacts.length,
    }),
    [data?.contacts, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

type ConversationsData = {
  conversations: ConversationDataDto[];
};

export function useGetConversations() {
  const url = [CHAT_ENDPOINT, { params: { endpoint: 'conversations' } }];

  const { data, isLoading, error, isValidating } = useSWR<ConversationsData>(url, fetcher, {
    ...swrOptions,
  });

  const memoizedValue = useMemo(() => {
    const byId = data?.conversations.length ? keyBy(data.conversations, (option) => option.id) : {};
    const allIds = Object.keys(byId);

    return {
      conversations: { byId, allIds },
      conversationsLoading: isLoading,
      conversationsError: error,
      conversationsValidating: isValidating,
      conversationsEmpty: !isLoading && !isValidating && !allIds.length,
    };
  }, [data?.conversations, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

type ConversationData = {
  conversation: ConversationDataDto;
};

export function useGetConversation(conversationId: string) {
  const url = conversationId
    ? [CHAT_ENDPOINT, { params: { conversationId: `${conversationId}`, endpoint: 'conversation' } }]
    : '';

  const { data, isLoading, error, isValidating } = useSWR<ConversationData>(url, fetcher, {
    ...swrOptions,
  });

  const memoizedValue = useMemo(
    () => ({
      conversation: data?.conversation,
      conversationLoading: isLoading,
      conversationError: error,
      conversationValidating: isValidating,
      conversationEmpty: !isLoading && !isValidating && !data?.conversation,
    }),
    [data?.conversation, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function sendMessage(conversationId: string, messageData: MessageDataDto) {
  // This function is deprecated - use the messaging API hooks instead
  console.log('Sending message:', conversationId, messageData);
}

// ----------------------------------------------------------------------

export async function createConversation(conversationData: ConversationDataDto) {
  // This function is deprecated - use the messaging API hooks instead
  console.log('Creating conversation:', conversationData);
  return conversationData;
}

// ----------------------------------------------------------------------

export async function clickConversation(conversationId: string) {
  // TODO: Implement actual API call to mark conversation as read
  // For now, this is a placeholder function
  console.log('Clicked conversation:', conversationId);
}
