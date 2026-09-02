import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import friendsService from '../services/friendsService';
import { useAuthStore } from '../../auth/store';
import type { ChatMessage, PresenceStatus, SendMessageInput } from '../types';
/** Enviar heartbeat a cada intervalo enquanto o app estiver montado. */
export function usePresenceHeartbeat(intervalMs = 30_000) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    friendsService.heartbeat().catch(() => undefined);
    const id = window.setInterval(() => {
      friendsService.heartbeat().catch(() => undefined);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isAuthenticated, intervalMs]);
}

export function useFriends(pollMs = 30_000) {
  const queryClient = useQueryClient();

  const friends = useQuery({
    queryKey: ['friends', 'list'],
    queryFn: () => friendsService.listFriends(),
    refetchInterval: pollMs,
  });

  const requests = useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: () => friendsService.listRequests(),
    refetchInterval: pollMs,
  });

  const sendRequest = useMutation({
    mutationFn: (input: { email?: string; code?: string }) =>
      friendsService.sendRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'search'] });
    },
  });

  const accept = useMutation({
    mutationFn: (id: string) => friendsService.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
    },
  });

  const decline = useMutation({
    mutationFn: (id: string) => friendsService.declineRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => friendsService.cancelRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] }),
  });

  const remove = useMutation({
    mutationFn: (friendId: string) => friendsService.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'search'] });
    },
  });

  const searchUsers = useMutation({
    mutationFn: (q: string) => friendsService.searchUsers(q),
  });

  return {
    friends: friends.data ?? [],
    isLoadingFriends: friends.isLoading,
    requests: requests.data ?? [],
    isLoadingRequests: requests.isLoading,
    sendRequest: sendRequest.mutateAsync,
    isSendingRequest: sendRequest.isPending,
    acceptRequest: accept.mutateAsync,
    declineRequest: decline.mutateAsync,
    cancelRequest: cancel.mutateAsync,
    removeFriend: remove.mutateAsync,
    isRemoving: remove.isPending,
    searchUsers: searchUsers.mutateAsync,
    searchResults: searchUsers.data ?? [],
    isSearching: searchUsers.isPending,
  };
}

export function useMyCode() {
  return useQuery({
    queryKey: ['friends', 'my-code'],
    queryFn: () => friendsService.getMyCode(),
  });
}

export function useMyStatus() {
  return useQuery({
    queryKey: ['friends', 'my-presence'],
    queryFn: () => friendsService.getMyPresence(),
  });
}

export function useSetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: PresenceStatus) => friendsService.setStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'my-presence'] });
    },
  });
}

export function useConversation(friendId: string) {
  const queryClient = useQueryClient();
  const conversation = useQuery({
    queryKey: ['friends', 'conversation', friendId],
    queryFn: () => friendsService.listMessages(friendId),
    enabled: !!friendId,
    refetchInterval: 10_000,
  });

  const send = useMutation({
    mutationFn: (input: SendMessageInput) => friendsService.sendMessage(friendId, input),
    onSuccess: (msg) => {
      queryClient.setQueryData<{ items: unknown[] } | undefined>(
        ['friends', 'conversation', friendId],
        (old) => {
          if (!old) return { items: [msg], nextCursor: null };
          return { ...old, items: [...old.items, msg] };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
    },
  });

  const markRead = useMutation({
    mutationFn: () => friendsService.markRead(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
    },
  });

  return {
    messages: (conversation.data?.items ?? []) as ChatMessage[],
    conversation: conversation.data,
    isLoading: conversation.isLoading,
    sendMessage: send.mutateAsync,
    isSending: send.isPending,
    markRead: markRead.mutateAsync,
  };
}
