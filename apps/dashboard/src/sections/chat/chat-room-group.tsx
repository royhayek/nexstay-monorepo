import type { ConversationParticipantDto } from 'src/api/models';

import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { CollapseButton } from './styles';
import { ChatRoomParticipantDialog } from './chat-room-participant-dialog';

// ----------------------------------------------------------------------

type Props = {
  participants: ConversationParticipantDto[];
};

export function ChatRoomGroup({ participants }: Props) {
  const collapse = useBoolean(true);

  const [selected, setSelected] = useState<ConversationParticipantDto | null>(null);

  const handleOpen = useCallback((participant: ConversationParticipantDto) => {
    setSelected(participant);
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  const totalParticipants = participants.length;

  const renderList = () => (
    <>
      {participants.map((participant) => (
        <ListItemButton key={participant.id} onClick={() => handleOpen(participant)}>
          <Badge variant="invisible" badgeContent=" ">
            <Avatar
              alt={`${participant.firstName} ${participant.lastName}`}
              src={participant.avatarUrl}
            />
          </Badge>

          <ListItemText
            primary={`${participant.firstName} ${participant.lastName}`.trim()}
            secondary="User"
            slotProps={{
              primary: { noWrap: true },
              secondary: { noWrap: true, sx: { typography: 'caption' } },
            }}
            sx={{ ml: 2 }}
          />
        </ListItemButton>
      ))}
    </>
  );

  return (
    <>
      <CollapseButton
        selected={collapse.value}
        disabled={!totalParticipants}
        onClick={collapse.onToggle}
      >
        {`In room (${totalParticipants})`}
      </CollapseButton>

      <Collapse in={collapse.value}>{renderList()}</Collapse>

      {selected && (
        <ChatRoomParticipantDialog participant={selected} open={!!selected} onClose={handleClose} />
      )}
    </>
  );
}
