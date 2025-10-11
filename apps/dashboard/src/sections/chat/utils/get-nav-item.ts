import type { ConversationDataDto } from 'src/api/models/admin';

// ----------------------------------------------------------------------

type Props = {
  currentUserId: string;
  conversation: ConversationDataDto;
};

export function getNavItem({ currentUserId, conversation }: Props) {
  const { participants, last_activity, last_message } = conversation || {};

  const participantsInConversation = participants.filter(
    (participant) => participant.id !== currentUserId
  );

  const group = participantsInConversation.length > 1;

  const displayName = participantsInConversation
    .map((participant) => `${participant.firstName} ${participant.lastName}`.trim())
    .join(', ');

  const hasOnlineInGroup = group
    ? participantsInConversation.map((item) => item.presenceStatus).includes('available')
    : false;

  let displayText = '';

  if (last_message) {
    const sender = last_message.sender?.id === currentUserId ? 'You: ' : '';

    const message = last_message.message_type === 'image' ? 'Sent a photo' : last_message.content;

    displayText = `${sender}${message}`;
  }

  return {
    group,
    displayName,
    displayText,
    participants: participantsInConversation,
    lastActivity: last_activity,
    hasOnlineInGroup,
  };
}
