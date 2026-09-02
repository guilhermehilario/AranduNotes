import { useEffect, useRef } from 'react';
import friendsService from '../services/friendsService';
import { useNotificationStore } from '../../../store/notificationStore';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../auth/store';

const POLL_INTERVAL = 30_000;

/**
 * Detecta (por polling) eventos de amizade:
 *  - Nova solicitação de amizade recebida (notificação de pedido);
 *  - Um pedido enviado por mim foi aceito (novo amigo adicionado).
 */
export function useFriendNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const seededRef = useRef(false);
  // Mapa: id do pedido enviado -> nome do destinatário (para detectar aceite)
  const outgoingRef = useRef<Map<string, string>>(new Map());
  // Pedidos recebidos já notificados
  const notifiedIncomingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      let requests;
      try {
        requests = await friendsService.listRequests();
      } catch {
        return;
      }

      const incoming = requests.filter(
        (r) => r.direction === 'incoming' && r.status === 'pending',
      );
      const outgoingPending = requests.filter(
        (r) => r.direction === 'outgoing' && r.status === 'pending',
      );
      const outgoingPendingIds = new Set(outgoingPending.map((r) => r.id));

      if (seededRef.current) {
        // Novos pedidos recebidos
        for (const r of incoming) {
          if (notifiedIncomingRef.current.has(r.id)) continue;
          notifiedIncomingRef.current.add(r.id);
          useNotificationStore.getState().addNotification(
            'friendRequest',
            r.id,
            '🤝 Nova solicitação de amizade',
            `${r.user.name} quer ser seu amigo`,
          );
          useToastStore
            .getState()
            .addToast(`🤝 ${r.user.name} quer ser seu amigo`, 'info');
        }

        // Pedidos enviados que sumiram da lista = foram aceitos => novo amigo
        for (const [id, name] of outgoingRef.current) {
          if (!outgoingPendingIds.has(id)) {
            useNotificationStore.getState().addNotification(
              'friend',
              id,
              '✅ Novo amigo!',
              `${name} aceitou sua solicitação de amizade`,
            );
            useToastStore
              .getState()
              .addToast(`✅ ${name} agora é seu amigo!`, 'success');
          }
        }
      } else {
        // Primeira execução: ignora o que já existe (seed)
        for (const r of incoming) notifiedIncomingRef.current.add(r.id);
      }

      outgoingRef.current = new Map(
        outgoingPending.map((r) => [r.id, r.user.name]),
      );
      seededRef.current = true;
    };

    const initial = setTimeout(check, 3000);
    const interval = setInterval(check, POLL_INTERVAL);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [isAuthenticated]);
}
