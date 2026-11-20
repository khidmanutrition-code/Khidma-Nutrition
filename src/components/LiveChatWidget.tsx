import React, { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { MessageSquare, Send, ShieldCheck, Store, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { ChatMessageRecord, MarketplaceLanguage, VendorStoreRecord } from '../types';
import type { Product } from '../data/products';
import { saveChatMessageToFirestore } from '../lib/storeDb';
import { ResilientImage } from './ResilientImage';

interface LiveChatWidgetProps {
  open: boolean;
  onClose: () => void;
  vendor: VendorStoreRecord;
  productAttachment?: Product | null;
  buyerUid?: string;
  buyerName: string;
  firebaseUser?: User | null;
  lang?: MarketplaceLanguage;
  onOpenProduct?: (product: Product) => void;
}

const QUICK_REPLIES_BN = [
  'পণ্যটি কি স্টকে আছে?',
  'আজ অর্ডার করলে কবে ডেলিভারি পাবো?',
  'পাইকারি নিলে ডিসকাউন্ট হবে?',
  '১০০% খাঁটি গ্যারান্টি আছে তো?',
];

const QUICK_REPLIES_EN = [
  'Is this item currently in stock?',
  'When will I receive delivery if ordered today?',
  'Any bulk/wholesale discount available?',
  'Is 100% purity & return warranty included?',
];

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  open,
  onClose,
  vendor,
  productAttachment,
  buyerUid,
  buyerName,
  firebaseUser,
  lang = 'bn',
  onOpenProduct,
}) => {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const stableBuyerId = buyerUid || 'guest-buyer';
  const roomId = `room-${vendor.id}-${stableBuyerId}`.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 140);

  useEffect(() => {
    if (!open) return;

    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { roomId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:history', (payload: { roomId: string; messages: ChatMessageRecord[] }) => {
      if (payload?.roomId === roomId && Array.isArray(payload.messages)) {
        setMessages(payload.messages);
      }
    });

    socket.on('chat:message', (msg: ChatMessageRecord) => {
      if (msg?.roomId !== roomId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [open, roomId]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (!open) return null;

  const sendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean) return;
    setDraft('');

    const msg: ChatMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId,
      sellerId: vendor.id,
      sellerName: vendor.storeName,
      senderRole: 'buyer',
      senderName: buyerName || 'Customer',
      text: clean,
      ...(productAttachment
        ? {
            productAttachment: {
              id: productAttachment.id,
              name: productAttachment.name,
              price: productAttachment.price,
              image: productAttachment.image,
            },
          }
        : {}),
      createdAtMs: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);
    socketRef.current?.emit('chat:message', msg);

    if (firebaseUser) {
      await saveChatMessageToFirestore(msg, firebaseUser.uid, vendor.ownerUid);
    }
  };

  const quickReplies = lang === 'en' ? QUICK_REPLIES_EN : QUICK_REPLIES_BN;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[350px] sm:w-[390px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-[#DDDDEF] overflow-hidden flex flex-col max-h-[540px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-extrabold truncate">{vendor.storeName}</h3>
              {vendor.tier === 'Official Mall' && (
                <span className="px-1.5 py-0.5 rounded bg-[#2563EB] text-[9px] font-bold uppercase shrink-0">
                  Mall
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/80 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
              <span>
                {vendor.chatResponsePercent}% {lang === 'en' ? 'Response Rate' : 'রেসপন্স রেট'}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="p-1.5 rounded-full hover:bg-white/15 text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Product Attachment Preview */}
      {productAttachment && (
        <div className="px-3 py-2 bg-[#F4F7FF] border-b border-[#DDDDEF] flex items-center gap-2.5">
          <div className="w-10 h-10 rounded border border-[#DDDDEF] overflow-hidden bg-white shrink-0">
            <ResilientImage
              src={productAttachment.image}
              alt={productAttachment.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-[#081149] truncate">{productAttachment.name}</p>
            <p className="text-xs font-extrabold text-[#663CBC]">
              ৳{productAttachment.price.toLocaleString('en-US')}
            </p>
          </div>
          {onOpenProduct && (
            <button
              type="button"
              onClick={() => onOpenProduct(productAttachment)}
              className="text-[10px] font-bold text-[#663CBC] hover:underline shrink-0 cursor-pointer"
            >
              {lang === 'en' ? 'View' : 'দেখুন'}
            </button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F9FAFB] min-h-[240px]">
        <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" />
          <span>
            {lang === 'en'
              ? `Assalamu Alaikum! Ask ${vendor.storeName} directly about purity, batch date, or wholesale pricing.`
              : `আসসালামু আলাইকুম! ${vendor.storeName}-কে পণ্যের মান, ব্যাচ বা ডেলিভারি সম্পর্কে সরাসরি প্রশ্ন করুন।`}
          </span>
        </div>

        {messages.map((m) => {
          const isBuyer = m.senderRole === 'buyer';
          return (
            <div key={m.id} className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-[#6B7280] mb-0.5 px-1">
                {m.senderName} ·{' '}
                {new Date(m.createdAtMs).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <div
                className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-xs ${
                  isBuyer
                    ? 'bg-gradient-to-r from-[#663CBC] to-[#2563EB] text-white rounded-br-none'
                    : 'bg-white border border-[#DDDDEF] text-[#081149] rounded-bl-none'
                }`}
              >
                {m.productAttachment && (
                  <div
                    className={`mb-1.5 p-1.5 rounded border text-[10px] flex items-center gap-2 ${
                      isBuyer ? 'bg-black/15 border-white/20 text-white' : 'bg-[#F4F7FF] border-[#DDDDEF]'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="truncate font-semibold">{m.productAttachment.name}</span>
                  </div>
                )}
                <p>{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-3 py-2 bg-white border-t border-[#E7EDFF] flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickReplies.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void sendMessage(q)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#F5F3FF] border border-[#663CBC]/30 text-[10px] font-semibold text-[#663CBC] hover:bg-[#663CBC] hover:text-white transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(draft);
        }}
        className="p-2.5 bg-white border-t border-[#DDDDEF] flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={lang === 'en' ? 'Write a message to seller...' : 'বিক্রেতাকে মেসেজ লিখুন...'}
          className="flex-1 h-9 px-3 rounded-lg border border-[#DDDDEF] text-xs focus:outline-none focus:border-[#663CBC]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="ot-gradient-btn h-9 px-3.5 rounded-lg text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{lang === 'en' ? 'Send' : 'পাঠান'}</span>
        </button>
      </form>
    </div>
  );
};
