import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    Send,
    Search,
    User,
    Mail,
    ArrowLeft,
    Loader2,
    MessageSquare,
    UserCircle,
    Check,
    Megaphone,
    Filter,
    X
} from 'lucide-react';

const Messaging = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [search, setSearch] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [sending, setSending] = useState(false);

    // Communication Modal State
    const [showCommModal, setShowCommModal] = useState(false);
    const [commType, setCommType] = useState('broadcast'); // broadcast, group
    const [commTitle, setCommTitle] = useState('');
    const [commContent, setCommContent] = useState('');
    const [commFilters, setCommFilters] = useState({
        hasCbe: true,
        isActivated: true,
        internshipStatus: 'all'
    });
    const [commLoading, setCommLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [toast, setToast] = useState(null);
    const messagesEndRef = useRef(null);

    const currentUserId = user?._id || user?.id || user?.data?._id || user?.data?.id;
    const userRole = user?.role || user?.data?.role;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const init = async () => {
            setLoadingContacts(true);
            try {
                const res = await api.get('/messages/contacts');
                const contactsList = Array.isArray(res?.data) ? res.data : [];
                setContacts(contactsList);

                const params = new URLSearchParams(location.search);
                const targetUserId = params.get('userId');

                if (targetUserId) {
                    const contact = contactsList.find(c => String(c._id) === String(targetUserId));
                    if (contact) setSelectedContact(contact);
                }
            } catch (err) {
                setToast({ type: 'error', text: 'Failed to load contacts.' });
            } finally {
                setLoadingContacts(false);
            }
        };
        init();

        const intervalId = setInterval(() => fetchContacts(true), 10000);
        return () => clearInterval(intervalId);
    }, [location.search]); // Added location.search to dependency array

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const targetUserId = params.get('userId');
        if (targetUserId && contacts.length > 0) {
            const contact = contacts.find(c => String(c._id) === String(targetUserId));
            if (contact && (!selectedContact || String(selectedContact._id) !== String(targetUserId))) {
                setSelectedContact(contact);
            }
        }
    }, [location.search, contacts]);

    useEffect(() => {
        if (selectedContact) {
            fetchConversation(selectedContact._id);
            const intervalId = setInterval(() => fetchConversation(selectedContact._id, true), 5000);
            return () => clearInterval(intervalId);
        }
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const fetchContacts = async (isBackground = false) => {
        try {
            const res = await api.get('/messages/contacts');
            setContacts(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            if (!isBackground) {
                setToast({ type: 'error', text: 'Failed to refresh contacts.' });
                setTimeout(() => setToast(null), 3000);
            }
        }
    };

    const fetchConversation = async (contactId, isBackground = false) => {
        if (!isBackground) setLoadingConversation(true);
        try {
            const res = await api.get(`/messages/conversation/${contactId}`);
            setConversation(Array.isArray(res?.data) ? res.data : []);
            if (!isBackground) {
                await api.put(`/messages/conversation/${contactId}/read`);
            }
        } catch (err) {
            if (!isBackground) {
                setToast({ type: 'error', text: 'Failed to load conversation.' });
                setTimeout(() => setToast(null), 3000);
            }
        } finally {
            if (!isBackground) setLoadingConversation(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = messageContent.trim();
        if (!user || !selectedContact || !text || sending) return;

        setSending(true);
        try {
            const res = await api.post('/messages', {
                receiverId: selectedContact._id,
                message: text
            });

            if (res?.data) {
                const sentMsg = res.data;
                setConversation(prev => [...prev, sentMsg]);
                setContacts(prev => prev.map(c => c._id === selectedContact._id ? {
                    ...c,
                    lastMessage: {
                        message: sentMsg.message,
                        createdAt: sentMsg.createdAt,
                        isRead: false,
                        senderId: currentUserId
                    }
                } : c));
                setMessageContent('');
            }
        } catch (err) {
            setToast({ type: 'error', text: 'Failed to send message.' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSending(false);
        }
    };

    const handleSendCommunication = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        let newErrors = {};
        if (!commTitle.trim()) newErrors.title = "Required";
        if (!commContent.trim()) newErrors.content = "Required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setToast({ type: 'error', text: 'Please fill out all required fields.' });
            return;
        }

        if (commLoading) return;

        setCommLoading(true);
        try {
            const payload = {
                type: commType,
                title: commTitle,
                content: commContent,
                filters: commType === 'group' ? commFilters : null
            };

            const res = await api.post('/communication/send', payload);
            setToast({ type: 'success', text: res.data?.message || 'Message sent successfully.' });
            setShowCommModal(false);
            setCommTitle('');
            setCommContent('');
        } catch (err) {
            setToast({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to send communication.' });
        } finally {
            setCommLoading(false);
        }
    };

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const filteredContacts = contacts.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.username || '').toLowerCase().includes(search.toLowerCase())
    );

    const getAvatarInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    const canBroadcast = userRole === 'Admin' || userRole === 'Dean';

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden h-[calc(100vh-180px)] min-h-[600px] flex relative">
            {toast && (
                <div className={`absolute top-4 right-4 z-[100] px-4 py-3 rounded-2xl text-xs font-black shadow-2xl border animate-in slide-in-from-right-5 ${toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {toast.text}
                    <button onClick={() => setToast(null)} className="ml-4 opacity-50 hover:opacity-100">×</button>
                </div>
            )}

            {/* Left Sidebar */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                <div className="p-6 bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <MessageSquare className="text-dbu-primary w-6 h-6" />
                            Chat
                        </h2>
                        {canBroadcast && (
                            <button
                                onClick={() => setShowCommModal(true)}
                                className="p-2 rounded-xl bg-dbu-primary/10 text-dbu-primary hover:bg-dbu-primary hover:text-white transition-all shadow-sm"
                                title="Broadcast / Group Message"
                            >
                                <Megaphone className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-dbu-primary" /></div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="text-sm text-slate-400 font-medium">No contacts available</p>
                        </div>
                    ) : filteredContacts.map(c => (
                        <button
                            key={c._id}
                            onClick={() => setSelectedContact(c)}
                            className={`w-full p-4 flex items-center gap-4 hover:bg-white transition-all border-b border-slate-50 ${selectedContact?._id === c._id ? 'bg-white shadow-sm ring-1 ring-inset ring-dbu-primary/10' : ''}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${selectedContact?._id === c._id ? 'bg-dbu-primary' : 'bg-slate-300'}`}>
                                {getAvatarInitial(c.name)}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="font-black text-slate-800 truncate text-sm">{c.name}</p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {c.lastMessage ? (
                                        <span className={c.unreadCount > 0 ? 'font-bold text-slate-900' : ''}>
                                            {String(c.lastMessage.senderId) === String(currentUserId) ? 'You: ' : ''}
                                            {c.lastMessage.message}
                                        </span>
                                    ) : 'No messages'}
                                </p>
                            </div>
                            {c.unreadCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-dbu-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse">
                                    {c.unreadCount}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="w-10 h-10 rounded-xl bg-dbu-primary flex items-center justify-center text-white font-bold shadow-md">
                                {getAvatarInitial(selectedContact.name)}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800">{selectedContact.name}</h3>
                                <p className="text-[10px] font-bold text-dbu-primary uppercase tracking-widest">{selectedContact.role}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50">
                            {loadingConversation ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-dbu-primary" /></div>
                            ) : conversation.length === 0 ? (
                                <div className="text-center text-slate-400 mt-20 italic font-medium">No messages yet. Say hi!</div>
                            ) : conversation.map((msg, idx) => {
                                const isSender = String(msg.senderId) === String(currentUserId);
                                return (
                                    <div key={msg._id || idx} className={`flex w-full ${isSender ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm relative ${isSender ? 'bg-dbu-primary text-white rounded-tr-none' : 'bg-[#E9E9EB] text-slate-800 rounded-tl-none'}`}>
                                                <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.message}</p>
                                                <div className="flex items-center gap-1 mt-1 justify-end opacity-60">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isSender && (
                                                        <div className="flex items-center">
                                                            <Check className={`w-3 h-3 ${msg.isRead ? 'text-blue-200' : 'text-white/50'} stroke-[3px]`} />
                                                            {msg.isRead && <Check className="w-3 h-3 -ml-1.5 text-blue-200 stroke-[3px]" />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white">
                            <form onSubmit={handleSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all shadow-inner font-bold"
                                    value={messageContent}
                                    onChange={e => setMessageContent(e.target.value)}
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageContent.trim() || sending}
                                    className="w-14 h-14 bg-dbu-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-dbu-accent transition-all disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                            <MessageSquare className="w-10 h-10 text-slate-200" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-400">Select a contact to start chatting</h3>
                            <p className="text-sm text-slate-300 mt-2">Pick a user from the left to begin your conversation.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Communication Modal */}
            {showCommModal && (
                <>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] animate-in fade-in duration-300" onClick={() => setShowCommModal(false)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl z-[201] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 bg-dbu-primary text-white relative">
                            <button onClick={() => setShowCommModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                                <Megaphone className="w-6 h-6" />
                                {commType === 'broadcast' ? 'Broadcast Message' : 'Group Communication'}
                            </h3>
                            <p className="text-white/70 text-xs font-bold tracking-widest uppercase">Reach multiple students at once</p>
                        </div>

                        <form onSubmit={handleSendCommunication} className="p-8 space-y-6">
                            <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCommType('broadcast')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${commType === 'broadcast' ? 'bg-white shadow-md text-dbu-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Broadcast All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCommType('group')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${commType === 'group' ? 'bg-white shadow-md text-dbu-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Filtered Group
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Important Update"
                                        className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all ${errors.title ? 'border-red-500' : 'border-slate-100'}`}
                                        value={commTitle}
                                        onChange={e => { setCommTitle(e.target.value); setErrors({ ...errors, title: null }); }}
                                    />
                                    {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Content</label>
                                    <textarea
                                        placeholder="Type your announcement here..."
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-3xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary h-32 resize-none transition-all ${errors.content ? 'border-red-500' : 'border-slate-100'}`}
                                        value={commContent}
                                        onChange={e => { setCommContent(e.target.value); setErrors({ ...errors, content: null }); }}
                                    />
                                    {errors.content && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.content}</p>}
                                </div>

                                {commType === 'group' && (
                                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter Target Students</p>
                                            <Filter className="w-3 h-3 text-slate-400" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-dbu-primary/30 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={!commFilters.hasCbe}
                                                    onChange={e => setCommFilters({ ...commFilters, hasCbe: !e.target.checked })}
                                                    className="w-4 h-4 rounded text-dbu-primary focus:ring-dbu-primary"
                                                />
                                                <span className="text-[10px] font-bold text-slate-600">No CBE Account</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-dbu-primary/30 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={!commFilters.isActivated}
                                                    onChange={e => setCommFilters({ ...commFilters, isActivated: !e.target.checked })}
                                                    className="w-4 h-4 rounded text-dbu-primary focus:ring-dbu-primary"
                                                />
                                                <span className="text-[10px] font-bold text-slate-600">Not Activated</span>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Internship Status</label>
                                            <select
                                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-dbu-primary"
                                                value={commFilters.internshipStatus}
                                                onChange={e => setCommFilters({ ...commFilters, internshipStatus: e.target.value })}
                                            >
                                                <option value="all">All Students</option>
                                                <option value="not_applied">Not Applied Yet</option>
                                                <option value="pending">Awaiting Approval</option>
                                                <option value="approved">Approved & Active</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={commLoading || !commContent.trim()}
                                className="w-full py-4 bg-dbu-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-dbu-accent transition-all flex items-center justify-center gap-3"
                            >
                                {commLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Send
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default Messaging;
