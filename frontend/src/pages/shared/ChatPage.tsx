import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  Stethoscope,
  Clock,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { chatService } from '@/services/chat.service';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get('roomId');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chat rooms
  const { data: roomsRes, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => chatService.getRooms(),
  });

  const rooms = roomsRes?.data?.data || [];

  // Automatically select room: priority to query param, else first room
  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    } else if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, initialRoomId, selectedRoomId]);

  // Load messages for selected room
  const { data: messagesRes, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedRoomId],
    queryFn: () => chatService.getMessages(selectedRoomId!),
    enabled: !!selectedRoomId,
  });

  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (messagesRes?.data?.data) {
      setMessages(messagesRes.data.data);
    }
  }, [messagesRes]);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Socket.IO real-time binding & presence
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    setIsSocketConnected(socket.connected);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (selectedRoomId) {
      // Join room
      socket.emit('join_room', selectedRoomId);

      // Handle incoming message in real time
      const handleNewMessage = (msg: any) => {
        if (msg.roomId === selectedRoomId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        // Invalidate room list so last message updates live
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      };

      // Handle typing indicator
      const handleUserTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        if (userId !== user?.id) {
          setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);

      return () => {
        socket.emit('leave_room', selectedRoomId);
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [selectedRoomId, user?.id, queryClient]);

  // Send message mutation (REST backed + Socket.IO broadcast)
  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(selectedRoomId!, content),
    onSuccess: (res) => {
      const savedMsg = res.data.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRoomId) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('typing', { roomId: selectedRoomId, isTyping: false });
    }

    sendMutation.mutate(messageText.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    const socket = getSocket();
    if (socket && selectedRoomId) {
      socket.emit('typing', { roomId: selectedRoomId, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: selectedRoomId, isTyping: false });
      }, 2000);
    }
  };

  const activeRoom = rooms.find((r: any) => r.id === selectedRoomId);

  // Determine the display title for the other participant
  const getOtherParticipant = (room: any) => {
    if (user?.role === 'PATIENT') {
      const doc = room.doctor;
      return {
        name: doc?.user ? `Dr. ${doc.user.firstName} ${doc.user.lastName}` : 'Assigned Doctor',
        role: doc?.specialization || 'Healthcare Provider',
        avatarBg: 'bg-teal-600 text-white',
      };
    } else {
      const pat = room.patient;
      return {
        name: pat?.user ? `${pat.user.firstName} ${pat.user.lastName}` : 'Patient',
        role: pat?.bloodGroup ? `Blood: ${pat.bloodGroup}` : 'Patient',
        avatarBg: 'bg-indigo-600 text-white',
      };
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white">
      {/* ── Left Pane: Rooms List ── */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/70">
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base flex items-center gap-2 text-slate-800">
              <MessageSquare className="h-5 w-5 text-teal-600" />
              Clinical Messages
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time doctor–patient chat</p>
          </div>
          {/* Socket Live Presence Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isSocketConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-amber-50 text-amber-700 border border-amber-300'
            }`}
          >
            {isSocketConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Syncing
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {roomsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No active conversations yet</p>
              <p className="text-slate-400 text-[11px]">
                Chat channels are opened automatically when an appointment is scheduled.
              </p>
            </div>
          ) : (
            rooms.map((room: any) => {
              const other = getOtherParticipant(room);
              const isSelected = room.id === selectedRoomId;
              const lastMsg = room.messages?.[0];

              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-teal-50/80 border-l-4 border-l-teal-600 shadow-sm'
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${other.avatarBg}`}
                  >
                    {other.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-sm truncate text-slate-900">{other.name}</p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{other.role}</p>
                    {lastMsg && (
                      <p className="text-xs text-slate-600 truncate mt-1 font-medium">
                        {lastMsg.senderId === user?.id ? 'You: ' : ''}
                        {lastMsg.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Pane: Real-Time Message Stream ── */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {!selectedRoomId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-6 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Select a consultation from the list</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Communicate securely with your doctor or patient with real-time updates and typing indicators.
            </p>
          </div>
        ) : (
          <>
            {/* Active Room Header */}
            {activeRoom && (
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                      getOtherParticipant(activeRoom).avatarBg
                    }`}
                  >
                    {getOtherParticipant(activeRoom).name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {getOtherParticipant(activeRoom).name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {getOtherParticipant(activeRoom).role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Live Encrypted
                  </div>
                </div>
              </div>
            )}

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="md" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600">Session Started</p>
                  <p className="text-slate-400 mt-1">Send a message to begin consultation.</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                          isMine
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed font-normal">
                          {msg.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Real-Time Typing Indicator */}
              {Object.values(typingUsers).some(Boolean) && (
                <div className="flex items-center gap-1.5 text-xs text-teal-700 italic px-2 bg-teal-50/60 p-2 rounded-xl w-fit border border-teal-100">
                  <span className="inline-block w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                  <span>Participant is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <Input
                placeholder="Type your medical query or clinical message..."
                value={messageText}
                onChange={handleInputChange}
                className="flex-1 bg-slate-50 border-slate-300 focus:bg-white text-sm"
                disabled={sendMutation.isPending}
              />
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 shadow-sm font-semibold gap-1.5"
                disabled={!messageText.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
