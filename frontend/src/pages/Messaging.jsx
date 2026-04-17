import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Send, User, Search, MessageSquare, Clock, ShieldCheck, Mail } from 'lucide-react';

const Messaging = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchContacts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedContact]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.get('/admin/users');
      const allUsers = res.data.data;
      
      // Filter based on role rules
      let allowed = [];
      if (user.role === 'student') {
        allowed = allUsers.filter(u => ['advisor', 'department_dean'].includes(u.role));
      } else if (user.role === 'advisor') {
        allowed = allUsers.filter(u => ['student', 'department_dean'].includes(u.role));
      } else if (user.role === 'department_dean') {
        allowed = allUsers.filter(u => ['student', 'advisor', 'college_admin'].includes(u.role));
      } else if (user.role === 'college_admin') {
        allowed = allUsers.filter(u => u._id !== user.id && u._id !== user._id);
      }
      
      setContacts(allowed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    setSending(true);
    try {
      await api.post('/messages', {
        receiverId: selectedContact._id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const getChatWithSelected = () => {
    if (!selectedContact) return [];
    return messages.filter(m => 
      (m.sender._id === selectedContact._id && m.receiver._id === (user.id || user._id)) ||
      (m.sender._id === (user.id || user._id) && m.receiver._id === selectedContact._id)
    ).reverse(); // API returns descending, we want ascending for chat
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-160px)] items-center justify-center bg-white rounded-2xl shadow-sm">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dbu-primary"></div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Sidebar: Contacts */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-dbu-primary outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No contacts found</div>
          ) : (
            filteredContacts.map(contact => (
              <button 
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center p-4 gap-3 transition-all hover:bg-white border-b border-slate-50 ${selectedContact?._id === contact._id ? 'bg-white border-l-4 border-l-dbu-primary shadow-sm' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-12 h-12 rounded-full bg-dbu-primary/10 flex items-center justify-center text-dbu-primary font-bold">
                  {contact.name.charAt(0)}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{contact.name}</p>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest opacity-60">{contact.role.replace('_', ' ')}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white z-10 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-dbu-primary text-white flex items-center justify-center font-bold">
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{selectedContact.name}</p>
                <p className="text-xs text-green-500 font-bold flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  Online
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {getChatWithSelected().length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <MessageSquare className="w-12 h-12 opacity-10" />
                  <p className="text-sm">Start a conversation with {selectedContact.name}</p>
                </div>
              ) : (
                getChatWithSelected().map(msg => {
                  const isMine = msg.sender._id === (user.id || user._id);
                  return (
                    <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMine ? 'bg-dbu-primary text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-2 flex items-center ${isMine ? 'text-dbu-light/70' : 'text-slate-400'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition-all text-sm"
                />
                <button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                  className="w-12 h-12 rounded-2xl bg-dbu-primary text-white flex items-center justify-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all transform active:scale-90 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-slate-50">
              <MessageSquare className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Select a conversation</h3>
            <p className="text-slate-500 max-w-sm">Choose a contact from the left menu to start messaging or viewing your history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
