// ----------------------------------------------------------------------

import type { MessageDataDto } from 'src/api/models/admin';

type Props = {
  currentUserId: string;
  message: MessageDataDto;
};

export function getMessage({ message, currentUserId }: Props) {
  const senderId = message?.sender?.id || '';
  const sender = message.sender;

  const isCurrentUser = senderId === currentUserId;

  const senderDetails = isCurrentUser
    ? { type: 'me' }
    : {
        avatarUrl: sender?.avatarUrl,
        firstName: sender?.firstName ?? 'Unknown',
      };

  const hasImage = message?.message_type === 'image';

  return { hasImage, me: isCurrentUser, senderDetails };
}
