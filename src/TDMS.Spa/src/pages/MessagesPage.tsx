import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'

interface InquiryItem {
  id: string
  learnerUserId: string
  learnerName: string
  tutorProfileId: string
  tutorUserId: string
  tutorName: string
  categoryId: number
  categoryName: string
  initialRequirementSummary: string
  status: 'Pending' | 'Accepted' | 'Declined'
  firebaseThreadId: string
  createdAt: string
  respondedAt?: string
}

interface MessageItem {
  id: string
  threadId: string
  senderUserId: string
  senderName: string
  text: string
  timestamp: string
}

export const MessagesPage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<InquiryItem[]>({
    queryKey: ['inquiries'],
    queryFn: () => api.get('/api/inquiries'),
  })

  const selectedInquiry = inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0]

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageItem[]>({
    queryKey: ['messages', selectedInquiry?.id],
    queryFn: () => api.get(`/api/messages/${selectedInquiry!.id}`),
    enabled: !!selectedInquiry && selectedInquiry.status === 'Accepted',
    refetchInterval: 3000, // Poll thread every 3 seconds
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'Accepted' | 'Declined' }) =>
      api.put(`/api/inquiries/${id}/respond`, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ inquiryId, text }: { inquiryId: string; text: string }) =>
      api.post(`/api/messages/${inquiryId}`, { text }),
    onSuccess: () => {
      setMessageInput('')
      queryClient.invalidateQueries({ queryKey: ['messages', selectedInquiry?.id] })
    },
  })

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedInquiry) return

    sendMessageMutation.mutate({
      inquiryId: selectedInquiry.id,
      text: messageInput.trim(),
    })
  }

  const isTutorForSelected = selectedInquiry && selectedInquiry.tutorUserId === user?.userId

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="border rounded-3xl bg-card shadow-sm overflow-hidden flex flex-col md:flex-row h-[750px]">
        {/* Left Pane: Inquiries List */}
        <div className={`w-full md:w-80 border-r flex flex-col bg-secondary/10 ${selectedInquiry ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h2 className="font-bold text-base flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Inquiries & Chats</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {inquiriesLoading && (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading inquiries...</div>
            )}

            {!inquiriesLoading && inquiries.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active inquiries. You will see conversations here once inquiries are sent or received.
              </div>
            )}

            {inquiries.map((inq) => {
              const active = (selectedInquiry?.id === inq.id)
              const partnerName = inq.tutorUserId === user?.userId ? inq.learnerName : inq.tutorName

              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiryId(inq.id)}
                  className={`w-full p-4 text-left transition flex flex-col space-y-1.5 ${
                    active ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{partnerName}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        inq.status === 'Accepted'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : inq.status === 'Declined'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-primary truncate">{inq.categoryName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{inq.initialRequirementSummary}</p>
                  <span className="text-[9px] text-muted-foreground/70">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Pane: Selected Conversation & Action */}
        <div className={`flex-1 flex flex-col bg-background ${selectedInquiry ? 'flex' : 'hidden md:flex'}`}>
          {selectedInquiry ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b flex items-center justify-between bg-card">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedInquiryId(null)}
                    className="p-1.5 rounded-lg border md:hidden hover:bg-secondary text-muted-foreground"
                    title="Back to Inquiries List"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="font-bold text-sm">
                      {selectedInquiry.tutorUserId === user?.userId
                        ? `Student: ${selectedInquiry.learnerName}`
                        : `Tutor: ${selectedInquiry.tutorName}`}
                    </h3>
                    <p className="text-xs text-muted-foreground">Subject: {selectedInquiry.categoryName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      selectedInquiry.status === 'Accepted'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : selectedInquiry.status === 'Declined'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    Inquiry {selectedInquiry.status}
                  </span>
                </div>
              </div>

              {/* Requirement Summary Box */}
              <div className="p-4 border-b bg-secondary/20 text-xs space-y-1">
                <span className="font-semibold text-foreground">Initial Requirement Summary:</span>
                <p className="text-muted-foreground">{selectedInquiry.initialRequirementSummary}</p>

                {/* Tutor Accept / Decline Actions */}
                {selectedInquiry.status === 'Pending' && isTutorForSelected && (
                  <div className="pt-3 flex items-center space-x-3">
                    <button
                      onClick={() => respondMutation.mutate({ id: selectedInquiry.id, decision: 'Accepted' })}
                      disabled={respondMutation.isPending}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition shadow-sm flex items-center space-x-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Accept Inquiry & Unlock Chat</span>
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: selectedInquiry.id, decision: 'Declined' })}
                      disabled={respondMutation.isPending}
                      className="px-4 py-1.5 rounded-lg bg-destructive text-white font-semibold text-xs hover:bg-destructive/90 transition shadow-sm flex items-center space-x-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}

                {selectedInquiry.status === 'Pending' && !isTutorForSelected && (
                  <p className="text-xs text-amber-600 pt-1">
                    Waiting for the tutor to accept your inquiry before real-time chat unlocks.
                  </p>
                )}

                {selectedInquiry.status === 'Declined' && (
                  <p className="text-xs text-destructive pt-1">
                    This inquiry was declined. Real-time chat is closed.
                  </p>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedInquiry.status !== 'Accepted' ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground space-y-2">
                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                    <p>Messaging unlocks once the tutor accepts the inquiry.</p>
                  </div>
                ) : messagesLoading ? (
                  <div className="text-center text-xs text-muted-foreground py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    Inquiry accepted! Send your first direct message below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderUserId === user?.userId
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs space-y-1 ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-secondary text-secondary-foreground rounded-bl-none'
                          }`}
                        >
                          <span className="text-[10px] opacity-75 font-bold block">{m.senderName}</span>
                          <p>{m.text}</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Message Input Box */}
              {selectedInquiry.status === 'Accepted' && (
                <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !messageInput.trim()}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Select an inquiry to view conversation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
