
import React, { useState } from 'react';
import { Wallet, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasMinLength = pass.length >= 8;
    return { hasUpper, hasSpecial, hasMinLength, isValid: hasUpper && hasSpecial && hasMinLength };
  };

  const pwdValidation = validatePassword(password);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin && !pwdValidation.isValid) {
        throw new Error('A senha deve ter 8+ caracteres, uma maiúscula e um caractere especial.');
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email: email.toLowerCase().trim(),
          password,
          name: name.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível completar a solicitação.');
      }

      onLogin(data);
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message === 'Failed to fetch' ? 'Erro de conexão com o servidor. Verifique se o Vercel está configurado.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl mb-4">
              <Wallet size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">FinanceView</h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">MongoDB Atlas Protected</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Nome Completo"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Seu E-mail"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua Senha"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && password.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Segurança:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {pwdValidation.hasMinLength ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />}
                    <span className={pwdValidation.hasMinLength ? 'text-green-600' : 'text-gray-400'}>8+ dig.</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {pwdValidation.hasUpper ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />}
                    <span className={pwdValidation.hasUpper ? 'text-green-600' : 'text-gray-400'}>ABC</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {pwdValidation.hasSpecial ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />}
                    <span className={pwdValidation.hasSpecial ? 'text-green-600' : 'text-gray-400'}>!@#</span>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-black text-center uppercase border border-red-100 leading-tight">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Entrar no Sistema' : 'Criar minha Conta')}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-gray-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
