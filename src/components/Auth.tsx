
import React, { useState } from 'react';
import { ListCheckIcon, UserIcon, UserCircleIcon } from './IconComponents';
import { api } from '../services/api';

interface AuthProps {
    onGuestLogin: () => void;
    onUserLogin: (userId: number, username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onGuestLogin, onUserLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setError(null);
        setIsLoading(true);

        try {
            if (isLoginMode) {
                const response = await api.login(username, password);
                if (response.user_id) {
                    onUserLogin(response.user_id, response.username);
                }
            } else {
                const response = await api.register(username, password);
                if (response.user_id) {
                    // Auto login after register
                    onUserLogin(response.user_id, response.username);
                }
            }
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-background flex items-center justify-center p-4 animate-fade-in bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2400)'}}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
                        <ListCheckIcon className="w-10 h-10 text-brand-accent" />
                        Tempo
                    </h1>
                    <p className="text-gray-300 mt-2">
                        {isLoginMode ? 'С возвращением' : 'Создать аккаунт'}
                    </p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 ml-1">Имя пользователя</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username" 
                            className="mt-1 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 ml-1">Пароль</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="mt-1 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white placeholder-gray-500"
                        />
                    </div>
                    
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading || !username || !password}
                        className="btn-loud-chicken w-full py-3 text-white font-bold disabled:opacity-50"
                    >
                        {isLoading ? 'Загрузка...' : (isLoginMode ? 'Войти' : 'Регистрация')}
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <button 
                        onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
                        className="text-brand-accent hover:text-white text-sm transition-colors"
                    >
                        {isLoginMode ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
                    </button>
                </div>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-white/20"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400">ИЛИ</span>
                    <div className="flex-grow border-t border-white/20"></div>
                </div>
                
                <div className="space-y-3">
                    <button 
                        onClick={onGuestLogin}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all"
                    >
                        <UserCircleIcon className="w-5 h-5" />
                        Продолжить как Гость
                    </button>
                </div>
                 <p className="text-[10px] text-center text-gray-500 mt-4">
                    Гостевой режим использует локальное хранилище. Данные не синхронизируются.
                </p>
            </div>
        </div>
    );
};

export default Auth;
