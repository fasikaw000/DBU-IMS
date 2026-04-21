import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Settings as SettingsIcon,
  Database,
  Mail,
  Lock,
  GraduationCap,
  Save,
  Activity,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/admin/settings', settings);
      setMessage('Success: System settings updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed: Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === id ? 'bg-dbu-primary text-white shadow-lg shadow-dbu-primary/20' : 'text-slate-500 hover:bg-slate-50'
        }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm">Configure global policies, email delivery, and security controls.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold text-sm ${message.includes('Success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="space-y-2 bg-white p-4 rounded-3xl border border-slate-100 h-fit">
          <TabButton id="general" label="General Settings" icon={SettingsIcon} />
          <TabButton id="user" label="User Policy" icon={CheckCircle2} />
          <TabButton id="academic" label="Academic Rules" icon={GraduationCap} />
          <TabButton id="email" label="Mail Server (SMTP)" icon={Mail} />
          <TabButton id="security" label="Security & Sessions" icon={Lock} />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">General Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.systemName}
                        onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'user' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">User & Authentication Policy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Password Length</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.passwordPolicy.minLength}
                        onChange={(e) => setSettings({ ...settings, passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) } })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Require Special Character</p>
                        <p className="text-[10px] text-slate-500">Force users to use @, $, !, etc.</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-dbu-primary focus:ring-dbu-primary"
                        checked={settings.passwordPolicy.requireSpecialChar}
                        onChange={(e) => setSettings({ ...settings, passwordPolicy: { ...settings.passwordPolicy, requireSpecialChar: e.target.checked } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">Internship Academic Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Duration (Months)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.academicSettings.defaultInternshipDurationMonths}
                        onChange={(e) => setSettings({ ...settings, academicSettings: { ...settings.academicSettings, defaultInternshipDurationMonths: parseInt(e.target.value) } })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['A', 'B', 'C', 'Pass'].map((grade) => (
                      <div key={grade} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Score for {grade}</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-dbu-primary"
                          value={settings.academicSettings.gradingScale[grade]}
                          onChange={(e) => setSettings({
                            ...settings,
                            academicSettings: {
                              ...settings.academicSettings,
                              gradingScale: { ...settings.academicSettings.gradingScale, [grade]: parseInt(e.target.value) }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">SMTP Email Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SMTP Host</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.emailSettings.smtpHost}
                        onChange={(e) => setSettings({ ...settings, emailSettings: { ...settings.emailSettings, smtpHost: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SMTP Port</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.emailSettings.smtpPort}
                        onChange={(e) => setSettings({ ...settings, emailSettings: { ...settings.emailSettings, smtpPort: parseInt(e.target.value) } })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Outbound Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.emailSettings.email}
                        onChange={(e) => setSettings({ ...settings, emailSettings: { ...settings.emailSettings, email: e.target.value } })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">App Password / Secret</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.emailSettings.appPassword}
                        onChange={(e) => setSettings({ ...settings, emailSettings: { ...settings.emailSettings, appPassword: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-black text-slate-800 border-b border-slate-50 pb-4">Security & Session Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inactivity Timeout (Minutes)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.securitySettings.sessionTimeoutMinutes}
                        onChange={(e) => setSettings({ ...settings, securitySettings: { ...settings.securitySettings, sessionTimeoutMinutes: parseInt(e.target.value) } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Login Attempts</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        value={settings.securitySettings.loginAttemptLimit}
                        onChange={(e) => setSettings({ ...settings, securitySettings: { ...settings.securitySettings, loginAttemptLimit: parseInt(e.target.value) } })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Save Area */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center text-[10px] font-bold text-slate-400 gap-2">
                <ShieldCheck className="w-3 h-3" />
                Changes require Administrative privileges
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-dbu-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center gap-2"
              >
                {saving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Parameters
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
