import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  UserCircle,
  ChevronDown,
  User,
  Lock,
  LogOut,
  Bell,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 3 seconds for real-time feel
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s instead of 3s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getAvatarInitial = (name) => {
    if (!name) return 'U';
    const cleaned = String(name).trim().replace(/\.+/g, '.');
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const honorifics = new Set(['dr', 'dr.', 'mr', 'mr.', 'ms', 'ms.', 'mrs', 'mrs.', 'prof', 'prof.']);
    const first = parts.find((p) => !honorifics.has(p.toLowerCase())) || parts[0];
    return (first?.charAt(0) || 'U').toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-30 w-full shadow-sm">
      <div className="flex-1">
        {/* Search or Page Title could go here */}
      </div>

      <div className="flex items-center space-x-6">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-dbu-primary/10 text-dbu-primary' : 'text-slate-500 hover:bg-slate-50'}`}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-3xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-black text-dbu-primary hover:text-dbu-accent transition-colors flex items-center"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.is_read ? 'bg-dbu-primary/[0.02]' : ''}`}
                        onClick={async () => {
                          if (!notif.is_read) {
                            try {
                              await api.put(`/notifications/${notif._id}/read`);
                              // Optimistically update local state
                              setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, is_read: true } : n));
                              setUnreadCount(prev => Math.max(0, prev - 1));
                            } catch (err) {
                              console.error("Error marking notification as read", err);
                            }
                          }
                          if (notif.link) navigate(notif.link);
                          setShowNotifications(false);
                        }}
                      >
                        {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-dbu-primary"></div>}
                        <p className={`text-xs leading-relaxed ${!notif.is_read ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                          {new Date(notif.created_at || notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}
                  className="w-full text-center py-3 text-[10px] font-black text-slate-400 hover:text-dbu-primary transition-colors uppercase tracking-[0.2em] bg-slate-50/30"
                >
                  View All Notifications
                </button>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-100 mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-4 hover:bg-slate-50 p-2 rounded-2xl transition-all group"
          >
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-sm font-black text-slate-800 leading-tight block">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-dbu-primary mt-1 opacity-70 block">
                {user?.role || ''}
              </span>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-dbu-primary/10 flex items-center justify-center text-dbu-primary group-hover:scale-105 transition-transform overflow-hidden">
                {user?.profilePhoto ? (
                  <img
                    src={`http://localhost:5001${user.profilePhoto}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-black">{getAvatarInitial(user?.name)}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Settings</p>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-dbu-primary transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <User className="mr-3 h-4 w-4" />
                  View Profile
                </Link>

                <div className="h-px bg-slate-50 my-1 mx-2"></div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
