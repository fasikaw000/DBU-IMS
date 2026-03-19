import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, Check, Clock, MailOpen, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
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
          <p className="text-slate-500">Stay updated on your internship applications, reports, and evaluations.</p>
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
            <p className="text-slate-400 text-sm mt-1">We'll notify you when there's an update on your internship.</p>
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
                    {notif.link && (
                       <Link to={notif.link} className="text-[10px] font-black tracking-widest text-dbu-primary hover:text-dbu-accent transition-colors">
                          VIEW DETAILS
                       </Link>
                    )}
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
    </div>
  );
};

export default NotificationCenter;
