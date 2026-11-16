import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Mail, Plus, Trash2, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export const AlertsModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('bakeli_alert_email') || '');
  const [keywords, setKeywords] = useState('');
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myAlerts, setMyAlerts] = useState([]);
  const [emailSent, setEmailSent] = useState(true);

  const loadAlerts = async (mail) => {
    if (!mail) return;
    try {
      const res = await apiService.getAlerts(mail);
      setMyAlerts(res.alerts || []);
    } catch { /* backend indisponible : on ignore silencieusement */ }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSubmitted(false);
      apiService.getAlertStatus().then((s) => setEmailSent(!!s.brevo_configured)).catch(() => setEmailSent(false));
      if (email) loadAlerts(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    if (!keywords.trim() && !sector && !location) {
      setError('Ajoutez au moins un critère : mots-clés, secteur ou lieu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.createAlert({ email, keywords: keywords.trim(), sector, location, frequency });
      localStorage.setItem('bakeli_alert_email', email);
      setSubmitted(true);
      setKeywords('');
      await loadAlerts(email);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err.message || "Impossible de créer l'alerte.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiService.deleteAlert(id, email);
      setMyAlerts((list) => list.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message || 'Suppression impossible.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-[95vw] sm:max-w-md max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 relative overflow-hidden">

        {/* Header compact */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
              Alerte Opportunité
            </h3>
            <p className="text-xs text-gray-500 truncate">
              Recevez les nouvelles offres par email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="px-5 pb-5 overflow-y-auto flex flex-col gap-3">
        {!emailSent && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Envoi d'emails en cours d'activation côté serveur — vos alertes seront conservées et envoyées dès que possible.
          </p>
        )}

        {submitted && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-semibold animate-fadeIn">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Alerte créée avec succès !</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Votre Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => { if (e.target.value) loadAlerts(e.target.value); }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Mots-clés</label>
            <input
              type="text"
              placeholder="développeur, comptable, stage marketing..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Secteur</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Tous</option>
                <option value="Informatique">Info.</option>
                <option value="Commerce">Commerce</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Santé">Santé</option>
                <option value="Éducation">Éducation</option>
                <option value="BTP">BTP</option>
                <option value="Transport">Transport</option>
                <option value="Services">Services</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Lieu</label>
              <input
                type="text"
                placeholder="Dakar"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Fréquence</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="instant">Instant.</option>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdo</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Activer l'alerte</span>
          </button>
        </form>

        {myAlerts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Mes alertes ({myAlerts.length})</h4>
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {myAlerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {[a.keywords, a.sector, a.location].filter(Boolean).join(' • ') || 'Toutes offres'}
                    </span>
                    <span className="text-xs text-gray-400">{a.frequency === 'instant' ? 'Instantanée' : a.frequency === 'weekly' ? 'Hebdomadaire' : 'Quotidienne'}</span>
                  </div>
                  <button onClick={() => handleDelete(a.id)} title="Désactiver" className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

      </div>
    </div>
  );
};
