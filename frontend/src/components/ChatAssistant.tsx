import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Bot, User, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Capability,
  Overview,
  fetchCapabilities,
  fetchOverview,
  getAccessToken,
  matchCapability,
  searchLaws,
} from '@/lib/api/platform';

interface Message {
  id: number;
  sender: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
  link?: { to: string; label: string };
  citations?: Array<Record<string, unknown>>;
}

interface ChatAssistantProps {
  onClose: () => void;
}

const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const STATUS_BADGE: Record<Capability['status'], string> = {
  implemented: 'bg-green-500/15 text-green-700 dark:text-green-300',
  partial: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
  planned: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  missing: 'bg-red-500/15 text-red-700 dark:text-red-300',
  removed: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

/**
 * FelLaw assistant – a thin client of the SAME contracts the Telegram bot uses:
 *   GET  /api/v1/platform/capabilities  (role-filtered catalog + deep links)
 *   GET  /api/v1/platform/overview      (profile-scoped read model, auth)
 *   POST /api/v1/chat/message           (RAG chat, auth)
 * It never executes mutations; it only links to the web flow that does.
 */
export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const de = language === 'de';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      content: de
        ? 'Hallo! Ich bin der FelLaw-Assistent. Ich kann Rechtsinformationen zum deutschen Recht geben, Sie zu Funktionen führen und Ihre Fälle zusammenfassen. Keine Rechtsberatung im Sinne des RDG.'
        : "Hello! I'm the FelLaw assistant. I can give legal information on German law, guide you to features and summarise your cases. This is not legal advice (RDG).",
      timestamp: now(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [caps, setCaps] = useState<Capability[]>([]);
  const [role, setRole] = useState<string>('anonymous');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const push = (m: Omit<Message, 'id' | 'timestamp'>) =>
    setMessages((prev) => [...prev, { ...m, id: prev.length + 1, timestamp: now() }]);

  useEffect(() => {
    let cancelled = false;
    fetchCapabilities()
      .then((r) => {
        if (cancelled) return;
        setCaps(r.capabilities);
        setRole(r.role);
        setBackendDown(false);
      })
      .catch(() => !cancelled && setBackendDown(true));
    if (getAccessToken()) {
      fetchOverview()
        .then((o) => !cancelled && setOverview(o))
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const quickCaps = useMemo(
    () => caps.filter((c) => c.kind !== 'mutation' && c.status !== 'missing' && c.status !== 'removed').slice(0, 6),
    [caps],
  );

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    push({ sender: 'user', content: text });
    setNewMessage('');

    // 1) Deterministic capability routing (same intents as the Telegram bot).
    const cap = matchCapability(text, caps);
    if (cap) {
      const label = de ? cap.label_de : cap.label_en;
      const statusNote =
        cap.status === 'implemented'
          ? ''
          : de
            ? ` (Status: ${cap.status}${cap.note ? ' – ' + cap.note : ''})`
            : ` (status: ${cap.status}${cap.note ? ' – ' + cap.note : ''})`;
      push({
        sender: 'ai',
        content: (de ? 'Passende Funktion: ' : 'Matching feature: ') + label + statusNote,
        link:
          cap.status === 'missing' || cap.status === 'removed'
            ? undefined
            : { to: cap.web_route.replace(':caseId', ''), label },
      });
      if (cap.kind !== 'read' || cap.id !== 'laws_search') return;
    }

    // 2) Real RAG chat for signed-in users; honest fallback otherwise.
    if (!getAccessToken()) {
      push({
        sender: 'system',
        content: de
          ? 'Für Rechtsfragen mit Quellenangaben bitte anmelden. Sofortige Hilfe ist ohne Anmeldung verfügbar.'
          : 'Sign in to ask legal questions with citations. Urgent help works without an account.',
        link: { to: '/auth/user/login', label: de ? 'Anmelden' : 'Sign in' },
      });
      return;
    }

    setIsTyping(true);
    try {
      // PR-02C Finding 1: bounded A-path — statute/source lookup. The
      // generative chat endpoint (POST /chat/message) is gated REVIEW_REQUIRED.
      const hits = await searchLaws({ q: text, limit: 5 });
      if (hits.length === 0) {
        push({
          sender: 'ai',
          content: de
            ? 'Dazu habe ich derzeit keine belastbare Gesetzesstelle. Bitte einen Anwalt klären.'
            : "I have no reliable statute for this. Please consult a lawyer.",
          link: { to: '/urgent/select', label: de ? 'Soforthilfe' : 'Urgent help' },
        });
      } else {
        const lines = hits
          .slice(0, 5)
          .map(
            (h) =>
              `• ${h.law_code} ${h.section ?? ''} – ${h.title}${h.url ? ` (${h.url})` : ''}`,
          )
          .join('\n');
        push({
          sender: 'ai',
          content: de
            ? `Zu Ihrer Frage habe ich folgende Gesetzesstellen gefunden:\n${lines}\n\n_Hinweis: Rechtsinformation, keine Rechtsberatung (RDG)._`
            : `I found these statutes for your question:\n${lines}\n\n_Note: legal information, not legal advice (RDG)._`,
          citations: hits.map((h) => ({
            law_code: h.law_code,
            section: h.section ?? '',
            title: h.title,
          })),
        });
      }
    } catch (e) {
      const err = e as Error & { status?: number };
      push({
        sender: 'system',
        content:
          err.status === 401
            ? de
              ? 'Sitzung abgelaufen – bitte erneut anmelden.'
              : 'Session expired – please sign in again.'
            : de
              ? `Der Assistent ist gerade nicht erreichbar (${err.message}).`
              : `The assistant is currently unavailable (${err.message}).`,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl">
      <Card className="bg-card border-2 border-primary">
        <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-lg">FelLaw Assistant</CardTitle>
            <span className="text-[10px] uppercase tracking-wide opacity-80">{role}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-primary/20 text-primary-foreground" aria-label="close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {backendDown && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs bg-yellow-500/10 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-3 w-3" />
              {de ? 'Backend nicht erreichbar – nur Navigation verfügbar.' : 'Backend unreachable – navigation only.'}
            </div>
          )}

          {overview && (
            <div className="px-4 py-2 text-xs border-b border-border bg-muted/40" data-testid="overview-strip">
              <span className="font-semibold">{overview.display_name}</span>
              {' · '}
              {de ? 'Fälle' : 'Cases'} {overview.counts.cases_open}/{overview.counts.cases_total}
              {overview.counts.cases_urgent > 0 && (
                <span className="ml-1 text-red-600">({overview.counts.cases_urgent} {de ? 'dringend' : 'urgent'})</span>
              )}
              {' · '}
              {de ? 'Ungelesen' : 'Unread'} {overview.counts.unread_notifications}
            </div>
          )}

          {quickCaps.length > 0 && (
            <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-border" data-testid="capability-chips">
              {quickCaps.map((c) => (
                <Link
                  key={c.id}
                  to={c.web_route.replace(':caseId', '')}
                  data-testid="capability-chip"
                  className={`text-[11px] px-2 py-0.5 rounded-full border border-border hover:bg-accent ${STATUS_BADGE[c.status]}`}
                  title={c.note || c.status}
                >
                  {de ? c.label_de : c.label_en}
                </Link>
              ))}
            </div>
          )}

          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.sender === 'system'
                        ? 'bg-muted border border-border text-foreground'
                        : 'bg-card border-2 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    <p className="text-xs font-semibold">
                      {message.sender === 'user' ? (de ? 'Sie' : 'You') : message.sender === 'system' ? 'System' : 'Assistant'}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {message.link && (
                    <Link to={message.link.to} className="inline-flex items-center gap-1 text-xs underline mt-2">
                      <ExternalLink className="h-3 w-3" /> {message.link.label}
                    </Link>
                  )}
                  {message.citations && message.citations.length > 0 && (
                    <ul className="mt-2 text-[11px] opacity-80 list-disc pl-4">
                      {message.citations.slice(0, 5).map((c, i) => (
                        <li key={i}>
                          {String((c as Record<string, unknown>).law_code ?? '')} {String((c as Record<string, unknown>).section ?? '')}{' '}
                          {String((c as Record<string, unknown>).title ?? '')}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border-2 border-border px-4 py-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{de ? 'Assistent schreibt…' : 'Assistant is typing…'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t-2 border-border bg-card">
            <div className="flex space-x-2">
              <Textarea
                placeholder={de ? 'Frage zum deutschen Recht oder zu FelLaw…' : 'Ask about German law or FelLaw services…'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 min-h-[60px] max-h-[120px]"
                rows={2}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isTyping} className="self-end" aria-label="send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {de ? 'Rechtsinformation, keine Rechtsberatung (RDG).' : 'Legal information, not legal advice (RDG).'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
