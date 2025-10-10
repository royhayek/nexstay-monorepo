import type { ConversationParticipantDto } from 'src/api/models';

import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSocket } from 'src/contexts/socket-io-context';
import {
  useMessagingControllerSendMessageV1,
  useMessagingControllerCreateConversationV1,
} from 'src/api/queries/messaging/messaging';

import { Iconify } from 'src/components/iconify';

import { useMockedUser } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  disabled: boolean;
  recipients: ConversationParticipantDto[];
  selectedConversationId: string;
  onAddRecipients: (recipients: ConversationParticipantDto[]) => void;
};

export function ChatMessageInput({
  disabled,
  recipients,
  onAddRecipients,
  selectedConversationId,
}: Props) {
  const router = useRouter();

  const { user } = useMockedUser();

  const fileRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState('');

  const { sendMessage: sendSocketMessage } = useSocket();
  const sendMessageMutation = useMessagingControllerSendMessageV1();
  const createConversationMutation = useMessagingControllerCreateConversationV1();

  // Use real-time socket for sending if available, fallback to API
  const shouldUseSocket = true; // You can add logic to determine when to use socket vs API

  const handleAttach = useCallback(() => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  }, []);

  const handleChangeMessage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  }, []);

  const handleSendMessage = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter' || !message.trim()) return;

      try {
        if (selectedConversationId) {
          // If the conversation already exists
          if (shouldUseSocket) {
            // Use Socket.IO for real-time messaging
            sendSocketMessage(selectedConversationId, message.trim());
          } else {
            // Fallback to API call
            await sendMessageMutation.mutateAsync({
              id: selectedConversationId,
              data: {
                content: message.trim(),
                message_type: 'TEXT',
              },
            });
          }
        } else {
          // If the conversation does not exist, create it first
          const newConversation = await createConversationMutation.mutateAsync({
            data: {
              participants: recipients.map((r) => r.id),
              type: 'ONE_TO_ONE',
              priority: 'NORMAL',
            },
          });

          if (newConversation) {
            router.push(`${paths.dashboard.chat}?id=${newConversation.id}`);
          }

          onAddRecipients([]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setMessage('');
      }
    },
    [
      message,
      selectedConversationId,
      shouldUseSocket,
      sendSocketMessage,
      sendMessageMutation,
      createConversationMutation,
      recipients,
      router,
      onAddRecipients,
    ]
  );

  return (
    <>
      <InputBase
        name="chat-message"
        id="chat-message-input"
        value={message}
        onKeyUp={handleSendMessage}
        onChange={handleChangeMessage}
        placeholder="Type a message"
        disabled={disabled}
        startAdornment={
          <IconButton>
            <Iconify icon="eva:smiling-face-fill" />
          </IconButton>
        }
        endAdornment={
          <Box sx={{ flexShrink: 0, display: 'flex' }}>
            <IconButton onClick={handleAttach}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
            <IconButton onClick={handleAttach}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>
            <IconButton>
              <Iconify icon="solar:microphone-bold" />
            </IconButton>
          </Box>
        }
        sx={[
          (theme) => ({
            px: 1,
            height: 56,
            flexShrink: 0,
            borderTop: `solid 1px ${theme.vars.palette.divider}`,
          }),
        ]}
      />

      <input type="file" ref={fileRef} style={{ display: 'none' }} />
    </>
  );
}
