import { useContext, useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { Bell, Check, Clock, MailOpen, Mail } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NotificationCenter = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const isMessageNotification = (notification) => {
    const t = String(notification?.type || '').toUpperCase();
    return t === 'MESSAGE' || t === 'NEW_MESSAGE';
  };

  const fetchConversation = async (otherUserId) => {
    if (!otherUserId) return;
    setLoadingConversation(true);
    try {
      const res = await api.get(`/messages/conversation/${otherUserId}`);
      setConversation(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setConversation([]);
      console.error(err);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleViewDetails = async (notification) => {
    setSelectedNotification(notification);
    setReplyContent('');
    setIsOpen(true);

    // Mark notification as read immediately
    if (!notification.is_read) {
      handleMarkRead(notification._id);
    }

    if (isMessageNotification(notification)) {
      const otherUserId = notification?.sender?._id || notification?.sender;
      // Mark entire conversation as read
      try {
        await api.put(`/messages/conversation/${otherUserId}/read`);
      } catch (err) {
        console.error("Error marking conversation as read", err);
      }
      fetchConversation(otherUserId);
    } else {
      setConversation([]);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedNotification || !isMessageNotification(selectedNotification) || !replyContent.trim() || sendingReply) return;
    const receiverId = selectedNotification?.sender?._id || selectedNotification?.sender;
    if (!receiverId) return;

    setSendingReply(true);
    try {
      const res = await api.post('/messages', {
        receiverId,
        content: replyContent.trim()
      });

      if (res?.data) {
        setConversation((prev) => [...prev, res.data]);
      } else {
        await fetchConversation(receiverId);
      }
      setReplyContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isOpen]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center text-dbu-dark">
            <Bell className="w-6 h-6 mr-2 text-dbu-primary" />
            Notification Center
          </h2>
          <p className="text-slate-500">Stay updated on key system activities and role-specific actions.</p>
        </div>
        <div className="text-sm font-bold text-dbu-primary bg-dbu-light px-4 py-2 rounded-full border border-dbu-primary/20">
          {notifications.filter(n => !n.is_read).length} Unread Updates
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">Your inbox is empty.</p>
            <p className="text-slate-400 text-sm mt-1">New updates will appear here as they happen.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notif => (
              <div key={notif._id} className={`p-6 transition hover:bg-slate-50 flex items-start gap-4 ${!notif.is_read ? 'bg-dbu-primary/5' : ''}`}>
                <div className={`p-2.5 rounded-full mt-1 ${!notif.is_read ? 'bg-dbu-primary text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                  {!notif.is_read ? <Mail className="w-5 h-5 shadow-inner" /> : <MailOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100 whitespace-nowrap ml-4">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-3">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(notif)}
                      className="text-[10px] font-black tracking-widest text-dbu-primary hover:text-dbu-accent transition-colors"
                    >
                      VIEW DETAILS
                    </button>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        className="text-[10px] font-black tracking-widest text-slate-400 hover:text-dbu-primary flex items-center transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        MARK AS READ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOpen && selectedNotification && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">Notification Details</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-black tracking-widest text-slate-500 hover:text-slate-700"
                >
                  CLOSE
                </button>
              </div>
              <div className="p-6 space-y-4">
                {isMessageNotification(selectedNotification) ? (
                  <>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/60">
                      <p className="text-sm font-black text-slate-800">
                        {selectedNotification.sender?.name || selectedNotification.sender?.username || 'Message Sender'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {new Date(selectedNotification.created_at || selectedNotification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="h-80 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4 shadow-inner">
                      {loadingConversation ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dbu-primary"></div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Loading history...</p>
                        </div>
                      ) : conversation.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs italic py-10">No conversation history found.</p>
                      ) : (
                        conversation.map((msg, idx) => {
                          const currentUserId = user?.id || user?._id;
                          const msgSenderId = msg?.sender?._id || msg?.sender;
                          const isMe = String(msgSenderId) === String(currentUserId);
                          const senderName = msg?.sender?.name || 'User';

                          return (
                            <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-1">
                                {isMe ? 'You' : senderName} ({new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-dbu-primary text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                <p className="leading-relaxed">{msg.content}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendReply} className="flex gap-3">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        placeholder="Type your reply..."
                      />
                      <button
                        type="submit"
                        disabled={!replyContent.trim() || sendingReply}
                        className="px-5 py-3 rounded-xl bg-dbu-primary text-white text-sm font-bold hover:bg-dbu-accent disabled:opacity-50"
                      >
                        {sendingReply ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Type</p>
                      <p className="text-sm font-bold text-slate-700">
                        {String(selectedNotification.type || 'General').replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Message</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedNotification.message}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Date & Time</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(selectedNotification.created_at || selectedNotification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Sender</p>
                        <p className="text-sm font-medium text-slate-700">
                          {selectedNotification.sender?.name || 'System'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
