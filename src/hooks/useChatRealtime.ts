import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseChatRealtimeProps {
  chatRoomId?: string;
  onMessageReceived?: () => void;
  onChatRoomUpdated?: () => void;
}

export const useChatRealtime = ({
  chatRoomId,
  onMessageReceived,
  onChatRoomUpdated,
}: UseChatRealtimeProps) => {
  useEffect(() => {
    if (!chatRoomId) return;

    let messageChannel: RealtimeChannel;
    let chatRoomChannel: RealtimeChannel;

    // Subscribe to new messages
    messageChannel = supabase
      .channel(`messages:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        () => {
          onMessageReceived?.();
        }
      )
      .subscribe();

    // Subscribe to chat room updates
    chatRoomChannel = supabase
      .channel(`chat_room:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${chatRoomId}`,
        },
        () => {
          onChatRoomUpdated?.();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(chatRoomChannel);
    };
  }, [chatRoomId, onMessageReceived, onChatRoomUpdated]);
};
