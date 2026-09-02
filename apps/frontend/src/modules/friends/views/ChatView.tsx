import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Share2,
  BookOpen,
  FileText,
  CheckCheck,
  Check,
} from 'lucide-react';
import { useConversation, useFriends } from '../hooks/useFriends';
import { useAuthStore } from '../../auth/store';
import { PageContainer } from '../../../components/ui/PageContainer.tsx';
import { Card } from '../../../components/ui/Card.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { useToastStore } from '../../../store/toastStore.ts';
import { extractApiError } from '../../../utils/api-errors.ts';
import { Avatar } from '../components/Avatar';
import {
  ShareContentModal,
  type ContentRef,
} from '../components/ShareContentModal';
import { formatTime } from '../../../utils/dateFormatUtils.ts';
import type { ChatMessage } from '../types';

export const ChatView: React.FC = () => {
  const { friendId = '' } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { friends } = useFriends();
  const friend = useMemo(
    () => friends.find((f) => f.id === friendId),
    [friends, friendId],
  );

  const { messages, isLoading, sendMessage, markRead } = useConversation(friendId);
  const [draft, setDraft] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (friendId) markRead().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    try {
      await sendMessage({ content: text, contentType: 'text' });
      setDraft('');
    } catch (err) {
      addToast(extractApiError(err, 'Não foi possível enviar a mensagem.'), 'error');
    }
  };

  const handleShare = async (ref: ContentRef) => {
    try {
      await sendMessage({
        contentType: 'content_link',
        contentRef: ref,
      });
      addToast('Conteúdo compartilhado!', 'success');
      setShareOpen(false);
    } catch (err) {
      addToast(extractApiError(err, 'Não foi possível compartilhar.'), 'error');
    }
  };

  const openContent = (ref: ContentRef) => {
    if (ref.resourceType === 'notebook') {
      navigate(`/notebooks/${ref.resourceId}`);
    } else if (ref.resourceType === 'leaf') {
      navigate(`/notebooks/${ref.resourceId}`);
    }
  };

  const renderMessage = (m: ChatMessage) => {
    const mine = m.senderId === currentUserId;
    return (
      <div
        key={m.id}
        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
            mine
              ? 'bg-brand-500 text-white rounded-br-sm'
              : 'bg-slate-100 dark:bg-dark-800 text-slate-800 dark:text-dark-100 rounded-bl-sm'
          }`}
        >
          {m.contentType === 'content_link' && m.contentRef ? (
            <button
              type="button"
              onClick={() => openContent(m.contentRef!)}
              className="flex items-center gap-2 text-left group"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  mine
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300'
                }`}
              >
                {m.contentRef.resourceType === 'notebook' ? (
                  <BookOpen className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.contentRef.title}</p>
                <p className={`text-xs opacity-80 group-hover:underline`}>
                  {m.contentRef.resourceType === 'notebook'
                    ? 'Abrir caderno'
                    : 'Abrir conteúdo'}
                </p>
              </div>
            </button>
          ) : (
            <p className="whitespace-pre-wrap break-words">{m.content}</p>
          )}
          <div
            className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${
              mine ? 'text-white/70' : 'text-slate-400 dark:text-dark-400'
            }`}
          >
            {formatTime(m.createdAt)}
            {mine && (m.readAt ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer gap="4" className="max-w-3xl" as="main">
      <Card className="p-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/friends')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar
          name={friend?.name ?? 'Amigo'}
          src={friend?.avatarUrl}
          size="sm"
          status={friend?.presence.online ? friend.presence.status : 'offline'}
        />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {friend?.name ?? 'Amigo'}
          </p>
          <p className="text-xs text-slate-500 dark:text-dark-400 truncate">
            {friend?.presence.online ? 'Online' : 'Offline'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setShareOpen(true)}
          title="Compartilhar conteúdo"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </Card>

      <Card className="p-4 flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3">
          {isLoading ? (
            <p className="text-sm text-slate-500 py-6 text-center">Carregando...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border-color)] pt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escreva uma mensagem..."
            className="flex-1 px-3.5 py-2.5 border rounded-xl bg-[var(--bg-surface)] focus:outline-none text-sm"
            style={{ borderColor: 'var(--border-color)' }}
          />
          <Button onClick={handleSend} disabled={!draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <ShareContentModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShare={handleShare}
      />
    </PageContainer>
  );
};
