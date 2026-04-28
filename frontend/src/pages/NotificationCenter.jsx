import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Bell, Check, Clock, MailOpen, Mail, ExternalLink } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getNotificationRoute } from '../utils/notificationRoutes';

const NotificationCenter = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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


  const navigate = useNavigate();

  const handleViewDetails = async (notification, e) => {
    if (e) e.stopPropagation(); // Prevent row click from firing
    setSelectedNotification(notification);

    // Mark notification as read
    if (!notification.is_read) {
      handleMarkRead(notification._id);
    }

    setIsOpen(true);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification._id);
    }
    const route = getNotificationRoute(notification.type, user?.role, notification.link);
    // null means no dedicated page (e.g. ANNOUNCEMENT) → stay on notification center
    navigate(route ?? '/notifications');
  };



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
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-6 transition hover:bg-slate-50 flex items-start gap-4 cursor-pointer border-b border-slate-50 last:border-0 ${!notif.is_read ? 'bg-dbu-primary/5' : ''}`}
              >
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
                      {new Date(notif.created_at || notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-3">
                    <button
                      type="button"
                      onClick={(e) => handleViewDetails(notif, e)}
                      className="text-[10px] font-black tracking-widest text-dbu-primary hover:text-dbu-accent transition-colors"
                    >
                      VIEW DETAILS
                    </button>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notif._id);
                        }}
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
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Notification Type</p>
                    <p className="text-sm font-black text-dbu-primary bg-dbu-primary/5 px-4 py-2 rounded-xl inline-block border border-dbu-primary/10">
                      {String(selectedNotification.type || 'General').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="space-y-1 text-right md:text-left">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Date & Time</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(selectedNotification.created_at || selectedNotification.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 shadow-inner">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-4">Message Content</p>
                  <p className="text-base text-slate-700 leading-relaxed font-medium">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-dbu-primary/10 rounded-full flex items-center justify-center text-dbu-primary">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Sender / Source</p>
                    <p className="text-sm font-black text-slate-800">
                      {selectedNotification.sender?.name || selectedNotification.sender?.fullName || 'System Automated Alert'}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] tracking-widest hover:bg-slate-50 transition"
                  >
                    CLOSE
                  </button>
                  {(() => {
                    const relatedRoute = getNotificationRoute(selectedNotification.type, user?.role, selectedNotification.link);
                    if (!relatedRoute) {
                      // ANNOUNCEMENT or no route: show informational text instead of a button
                      return (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center">
                          No related page
                        </span>
                      );
                    }
                    return (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate(relatedRoute);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-dbu-primary text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-dbu-accent transition shadow-lg shadow-dbu-primary/20"
                      >
                        <ExternalLink size={12} />
                        GO TO RELATED PAGE
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
