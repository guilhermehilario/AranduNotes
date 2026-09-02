import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  MessageCircle,
  CheckCircle2,
  XCircle,
  UserMinus,
} from 'lucide-react';
import {
  useFriends,
  useMyCode,
  useMyStatus,
  useSetStatus,
} from '../hooks/useFriends';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { EmptyState } from '../../../components/ui/EmptyState.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';
import { Avatar, PresenceDot } from '../components/Avatar';
import type { PresenceStatus } from '../types';

const ADD_TABS = [
  { key: 'code', label: 'Código' },
  { key: 'email', label: 'E-mail' },
] as const;

export const FriendsView: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const {
    friends,
    isLoadingFriends,
    requests,
    sendRequest,
    isSendingRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useFriends();
  const { data: myCode } = useMyCode();
  const { data: myPresence } = useMyStatus();
  const setStatus = useSetStatus();

  const [addTab, setAddTab] = useState<(typeof ADD_TABS)[number]['key']>('code');
  const [identifier, setIdentifier] = useState('');
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!myCode?.code) return;
    try {
      await navigator.clipboard.writeText(myCode.code);
      setCopied(true);
      addToast('Código copiado!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Não foi possível copiar.', 'error');
    }
  };

  const handleAdd = async () => {
    const value = identifier.trim();
    if (!value) {
      addToast('Digite o código ou o e-mail.', 'error');
      return;
    }
    try {
      if (addTab === 'code') {
        await sendRequest({ code: value });
      } else {
        await sendRequest({ email: value });
      }
      addToast('Solicitação de amizade enviada!', 'success');
      setIdentifier('');
    } catch (err) {
      addToast(extractApiError(err, 'Não foi possível enviar a solicitação.'), 'error');
    }
  };

  const handleRemove = async (friendId: string, name: string) => {
    if (!window.confirm(`Remover ${name} dos seus amigos?`)) return;
    setRemovingId(friendId);
    try {
      await removeFriend(friendId);
      addToast(`${name} removido.`, 'info');
    } catch (err) {
      addToast(extractApiError(err, 'Não foi possível remover.'), 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const onlineCount = friends.filter((f) => f.presence.online).length;
  const incoming = requests.filter((r) => r.direction === 'incoming');
  const outgoing = requests.filter((r) => r.direction === 'outgoing');

  const currentStatus: PresenceStatus = myPresence?.online
    ? (myPresence.status as PresenceStatus)
    : 'offline';

  return (
    <PageContainer gap="6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-500" /> Amigos
          </h1>
          <p className="text-sm text-slate-500 dark:text-dark-400">
            {onlineCount} de {friends.length} online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentStatus}
            onChange={(e) =>
              setStatus.mutate(e.target.value as PresenceStatus, {
                onSuccess: () => addToast('Status atualizado.', 'success'),
                onError: (err) =>
                  addToast(extractApiError(err, 'Erro ao atualizar status.'), 'error'),
              })
            }
            className="px-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-sm focus:outline-none"
          >
            <option value="available">Disponível</option>
            <option value="busy">Ocupado</option>
            <option value="invisible">Invisível</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Meu código de amigo */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-brand-500" /> Meu código de amigo
            </h2>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
              Compartilhe este código para que outras pessoas te adicionem.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-800 font-mono text-sm">
              {myCode?.code ?? '—'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!myCode?.code}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Adicionar amigo por código ou e-mail */}
      <Card className="p-4">
        <h2 className="font-semibold text-sm mb-3">Adicionar amigo</h2>
        <div className="flex gap-2 mb-3">
          {ADD_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setAddTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                addTab === t.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-dark-300 hover:bg-slate-200 dark:hover:bg-dark-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={
              addTab === 'code' ? 'Ex.: ARANDU-7KQ2F9' : 'nome@email.com'
            }
            inputMode={addTab === 'code' ? 'text' : 'email'}
            className="flex-1"
          />
          <Button onClick={handleAdd} isLoading={isSendingRequest}>
            <UserPlus className="h-4 w-4" /> Enviar convite
          </Button>
        </div>
      </Card>

      {/* Solicitações */}
      {(incoming.length > 0 || outgoing.length > 0) && (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">Solicitações</h2>
          {incoming.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-800/50"
            >
              <Avatar name={r.user.name} src={r.user.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.user.name}</p>
                <p className="text-xs text-slate-500 dark:text-dark-400 truncate">
                  {r.user.email}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => acceptRequest(r.id)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => declineRequest(r.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {outgoing.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-800/50"
            >
              <Avatar name={r.user.name} src={r.user.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.user.name}</p>
                <p className="text-xs text-slate-500 dark:text-dark-400 truncate">
                  {r.user.email}
                </p>
              </div>
              <span className="text-xs text-slate-400">Enviado</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => cancelRequest(r.id)}
              >
                Cancelar
              </Button>
            </div>
          ))}
        </Card>
      )}

      {/* Lista de amigos */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">
            Seus amigos ({friends.length})
          </h2>
        </div>
        {isLoadingFriends ? (
          <p className="text-sm text-slate-500 py-4">Carregando...</p>
        ) : friends.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Nenhum amigo ainda"
            description="Use seu código de amigo ou o e-mail para adicionar pessoas."
          />
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-800/50 rounded-xl px-2 group"
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => navigate(`/friends/chat/${f.id}`)}
                >
                  <Avatar
                    name={f.name}
                    src={f.avatarUrl}
                    status={f.presence.online ? f.presence.status : 'offline'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate flex items-center gap-2">
                      {f.name}
                      {f.presence.online && (
                        <PresenceDot status={f.presence.status} />
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-dark-400 truncate">
                      {f.lastMessage
                        ? f.lastMessage.content
                        : 'Nenhuma mensagem ainda'}
                    </p>
                  </div>
                  {f.unreadCount > 0 && (
                    <span className="flex-shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold flex items-center justify-center">
                      {f.unreadCount}
                    </span>
                  )}
                  <MessageCircle className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                </div>
                <button
                  type="button"
                  title="Remover amigo"
                  onClick={() => handleRemove(f.id, f.name)}
                  disabled={removingId === f.id}
                  className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0 p-1"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
};
