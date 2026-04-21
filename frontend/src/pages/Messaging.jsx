import { useState, useEffect, useContext, useRef } from 'react';
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
    UserCircle
} from 'lucide-react';

const Messaging = () => {
    const { user } = useContext(AuthContext);
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [search, setSearch] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (selectedContact) {
            fetchConversation(selectedContact._id);
        }
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            console.log('Fetching contacts...');
            const res = await api.get('/messages/contacts');
            setContacts(Array.isArray(res?.data) ? res.data : []);
            console.log('Contacts fetched:', res?.data);
        } catch (err) {
            console.error('Error fetching contacts:', err);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchConversation = async (contactId) => {
        setLoadingConversation(true);
        try {
            console.log(`Fetching conversation with ${contactId}...`);
            const res = await api.get(`/messages/conversation/${contactId}`);
            setConversation(Array.isArray(res?.data) ? res.data : []);
            console.log('Conversation fetched:', res?.data);
        } catch (err) {
            console.error('Error fetching conversation:', err);
        } finally {
            setLoadingConversation(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedContact || !messageContent.trim() || sending) return;

        setSending(true);
        try {
            const res = await api.post('/messages', {
                receiverId: selectedContact._id,
                content: messageContent.trim()
            });

            // Append new message to conversation locally for speed
            setConversation(prev => [...prev, res.data.data]);
            setMessageContent('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.replace('_', ' ').toLowerCase().includes(search.toLowerCase())
    );

    const currentUserId = user?.id || user?._id;

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden h-[calc(100vh-180px)] min-h-[600px] flex">
            {/* Left Panel: Contacts */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        <MessageSquare className="text-dbu-primary w-6 h-6" />
                        Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                            <Loader2 className="w-8 h-8 text-dbu-primary animate-spin" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading contacts...</p>
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center gap-4 opacity-40">
                            <UserCircle className="w-12 h-12 text-slate-300" />
                            <p className="text-sm font-bold text-slate-500">No contacts available</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {filteredContacts.map(c => (
                                <button
                                    key={c._id}
                                    onClick={() => setSelectedContact(c)}
                                    className={`w-full p-4 flex items-center gap-4 hover:bg-white transition-all text-left ${selectedContact?._id === c._id ? 'bg-white shadow-sm z-10' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 transition-all ${selectedContact?._id === c._id ? 'bg-dbu-primary text-white scale-105 shadow-lg shadow-dbu-primary/30' : 'bg-slate-100 text-slate-400'}`}>
                                        {c.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate ${selectedContact?._id === c._id ? 'text-dbu-primary' : 'text-slate-800'}`}>
                                            {c.name}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                                            {c.role.replace('_', ' ')}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Conversation */}
            <div className="flex-1 flex flex-col bg-white relative">
                {selectedContact ? (
                    <>
                        {/* Conversation Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-dbu-primary/10 flex items-center justify-center text-dbu-primary font-bold">
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800">{selectedContact.name}</h3>
                                    <p className="text-[10px] font-bold text-dbu-primary uppercase tracking-tighter">{selectedContact.role.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                            {loadingConversation ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <Loader2 className="w-8 h-8 text-dbu-primary animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading messages...</p>
                                </div>
                            ) : conversation.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Send className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-600">Start a conversation</p>
                                        <p className="text-xs text-slate-400">Say hello to {selectedContact.name}!</p>
                                    </div>
                                </div>
                            ) : (
                                conversation.map((msg, idx) => {
                                    const isMe = msg.sender._id === currentUserId || msg.sender === currentUserId;
                                    return (
                                        <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[70%] group relative`}>
                                                <div className={`px-5 py-3 rounded-3xl text-sm shadow-sm ${isMe ? 'bg-dbu-primary text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                </div>
                                                <p className={`text-[9px] mt-1 font-bold text-slate-300 uppercase tracking-tighter ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-slate-100 bg-white">
                            <form onSubmit={handleSendMessage} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all shadow-inner"
                                    value={messageContent}
                                    onChange={e => setMessageContent(e.target.value)}
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageContent.trim() || sending}
                                    className="w-14 h-14 bg-dbu-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center relative">
                            <MessageSquare className="w-16 h-16 text-slate-200" />
                            <div className="absolute -right-2 -top-2 w-10 h-10 bg-dbu-primary rounded-2xl rotate-12 flex items-center justify-center text-white shadow-lg">
                                <Send className="w-5 h-5 -rotate-12" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Your Conversations</h3>
                            <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                                Select a contact from the list to start messaging or continue your conversation.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messaging;
