import type { MessageDataDto, ConversationParticipantDto } from 'src/api/models';

// ----------------------------------------------------------------------

type Props = {
  currentUserId: string;
  message: MessageDataDto;
  participants: ConversationParticipantDto[];
};

export function getMessage({ message, participants, currentUserId }: Props) {
  const senderId = message?.sender?.id || '';
  const sender = participants.find((participant) => participant.id === senderId);

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
