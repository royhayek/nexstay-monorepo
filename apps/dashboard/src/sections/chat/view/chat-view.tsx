'use client';

import type { ConversationParticipantDto } from 'src/api/models';

import { useState, useEffect, useCallback, startTransition } from 'react';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useMessagingControllerGetConversationV1,
  useMessagingControllerGetSupportConversationsV1,
} from 'src/api/queries/messaging/messaging';

import { EmptyContent } from 'src/components/empty-content';

import { useMockedUser } from 'src/auth/hooks';

import { ChatNav } from '../chat-nav';
import { ChatLayout } from '../layout';
import { ChatRoom } from '../chat-room';
import { ChatMessageList } from '../chat-message-list';
import { ChatMessageInput } from '../chat-message-input';
import { ChatHeaderDetails } from '../chat-header-details';
import { ChatHeaderCompose } from '../chat-header-compose';
import { useCollapseNav } from '../hooks/use-collapse-nav';
import { useChatMessages } from '../hooks/use-chat-messages';

// ----------------------------------------------------------------------

export function ChatView() {
  const router = useRouter();

  const { user } = useMockedUser();

  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('id') || '';

  const { data: conversationsData, isLoading: conversationsLoading } =
    useMessagingControllerGetSupportConversationsV1();
  const {
    data: conversationData,
    error: conversationError,
    isLoading: conversationLoading,
  } = useMessagingControllerGetConversationV1(selectedConversationId, {
    query: { enabled: !!selectedConversationId },
  });

  const { messages: conversationMessages, isLoading: messagesLoading } =
    useChatMessages(selectedConversationId);

  const conversations = conversationsData?.data?.conversations || [];
  const conversation = conversationData;
  const contacts: ConversationParticipantDto[] = []; // TODO: Implement contacts API

  // Transform conversations for the existing UI structure
  const conversationsTransformed = {
    byId: conversations.reduce((acc, conv) => ({ ...acc, [conv.id]: conv }), {}),
    allIds: conversations.map((conv) => conv.id),
  };

  const roomNav = useCollapseNav();
  const conversationsNav = useCollapseNav();

  const [recipients, setRecipients] = useState<ConversationParticipantDto[]>([]);

  useEffect(() => {
    if (!selectedConversationId) {
      startTransition(() => {
        router.push(paths.dashboard.chat);
      });
    }
  }, [conversationError, router, selectedConversationId]);

  const handleAddRecipients = useCallback((selected: ConversationParticipantDto[]) => {
    setRecipients(selected);
  }, []);

  const filteredParticipants: ConversationParticipantDto[] = conversation
    ? conversation.data?.participants?.filter(
        (participant: ConversationParticipantDto) => participant.id !== `${user?.id}`
      ) || []
    : [];

  return (
    <DashboardContent
      maxWidth={false}
      sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}
    >
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Chat
      </Typography>

      <ChatLayout
        slots={{
          header: selectedConversationId ? (
            <ChatHeaderDetails
              collapseNav={roomNav}
              participants={filteredParticipants}
              loading={conversationLoading}
            />
          ) : (
            <ChatHeaderCompose contacts={contacts} onAddRecipients={handleAddRecipients} />
          ),
          nav: (
            <ChatNav
              contacts={contacts}
              conversations={conversationsTransformed}
              selectedConversationId={selectedConversationId}
              collapseNav={conversationsNav}
              loading={conversationsLoading}
            />
          ),
          main: (
            <>
              {selectedConversationId ? (
                conversationError ? (
                  <EmptyContent
                    title={conversationError.message}
                    imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-chat-empty.svg`}
                  />
                ) : (
                  <ChatMessageList
                    messages={conversationMessages}
                    participants={filteredParticipants}
                    loading={messagesLoading}
                  />
                )
              ) : (
                <EmptyContent
                  title="Good morning!"
                  description="Write something awesome..."
                  imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-chat-active.svg`}
                />
              )}

              <ChatMessageInput
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                selectedConversationId={selectedConversationId}
                disabled={!recipients.length && !selectedConversationId}
              />
            </>
          ),
          details: conversation && selectedConversationId && (
            <ChatRoom
              collapseNav={roomNav}
              participants={filteredParticipants}
              loading={conversationLoading}
              messages={conversationMessages}
            />
          ),
        }}
      />
    </DashboardContent>
  );
}
