import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { FirebaseService } from '../services/firebase';
import { X, Mail, Lock, Shield, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    if (password.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    if (mode === 'register') {
      const result = StorageService.register(cleanEmail, password, username);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.user) {
        onSuccess(result.user);
        onClose();
      }
    } else {
      const result = StorageService.login(cleanEmail, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.user) {
        onSuccess(result.user);
        onClose();
      }
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await FirebaseService.loginWithGoogle();
      if (user) {
        onSuccess(user);
        onClose();
        return;
      }
    } catch (e: any) {
      console.warn("Connexion Google popup:", e);
      if (e.message && e.message.includes('popup-closed-by-user')) {
        setError('Connexion Google annulée.');
      } else {
        setError('Impossible d\'ouvrir la fenêtre de connexion Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#070c1e] text-slate-100 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(160,88,255,0.4)]">
            <div className="w-full h-full bg-[#070c1e] rounded-[14px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-['Outfit'] text-white">
            {mode === 'login' ? 'Connexion House Game' : 'Créer un Compte'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connectez-vous pour retrouver vos favoris ou administrer le catalogue
          </p>
        </div>

        {/* Real Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="w-full mb-4 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm hover:border-white/25 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continuer avec Google</span>
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10" />
          <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-500 uppercase">Ou avec votre email</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pseudo du joueur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: JoueurPro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="galtiergabin76@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(160,88,255,0.4)] cursor-pointer mt-2"
          >
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <span>
              Nouveau joueur ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
              >
                Créer un compte
              </button>
            </span>
          ) : (
            <span>
              Déjà inscrit ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
              >
                Se connecter
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
