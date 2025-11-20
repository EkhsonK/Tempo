
import React, { useState } from 'react';
import { getGroundedResponse } from '../services/geminiService';
import { GroundingChunk } from '../types';
import Loader from './Loader';
import { GoogleIcon, LinkIcon } from './IconComponents';

const Search: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await getGroundedResponse(query);
            setResult(response);
        } catch (err) {
            setError('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4">Поиск с Google Grounding</h2>
            <p className="text-center text-brand-text-secondary mb-6">Получайте актуальные ответы от Gemini, основанные на результатах поиска Google.</p>
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Спросите о последних событиях..."
                    className="flex-grow bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    <GoogleIcon className="w-5 h-5" />
                    <span>Поиск</span>
                </button>
            </div>

            {isLoading && <div className="flex justify-center mt-8"><Loader /></div>}
            {error && <p className="text-center text-red-500">{error}</p>}
            
            {result && (
                <div className="bg-gray-800/50 rounded-lg p-6 animate-fade-in">
                    <h3 className="text-xl font-semibold mb-4">Ответ</h3>
                    <div className="prose prose-invert max-w-none text-brand-text-primary">
                      <p>{result.text}</p>
                    </div>

                    {result.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="text-lg font-semibold mb-3">Источники</h4>
                            <ul className="space-y-2">
                                {result.sources.map((source, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <LinkIcon className="w-4 h-4 mt-1 text-brand-text-secondary flex-shrink-0" />
                                        <a
                                            href={source.web?.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-secondary hover:underline break-all"
                                        >
                                            {source.web?.title || source.web?.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;