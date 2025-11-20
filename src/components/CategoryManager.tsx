import React, { useState, useEffect } from 'react';
import { ToDoItem } from '../types';
import { PlusIcon, TrashIcon } from './IconComponents';
import { api } from '../services/api';

interface CategoryManagerProps {
    isOpen: boolean;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    todos: ToDoItem[];
    setTodos: React.Dispatch<React.SetStateAction<ToDoItem[]>>;
    onClose: () => void;
    activeCategory: string;
    setActiveCategory: React.Dispatch<React.SetStateAction<string>>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, categories, setCategories, todos, setTodos, onClose, activeCategory, setActiveCategory }) => {
    const [newCategory, setNewCategory] = useState('');
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setConfirmingDelete(null);
            setDeletingCategory(null);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const handleAddCategory = async () => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory && !categories.includes(trimmedCategory)) {
            // Optimistic
            setCategories(prev => [...prev, trimmedCategory]);
            setNewCategory('');
            
            try {
                await api.addCategory(trimmedCategory);
            } catch (e) {
                console.error("API Error adding category");
            }
        }
    };

    const executeDelete = async (categoryToDelete: string) => {
        setDeletingCategory(categoryToDelete);
        setTimeout(async () => {
            // Optimistic
            const updatedTodos = todos.filter(todo => todo.category !== categoryToDelete);
            setTodos(updatedTodos);

            setCategories(prev => prev.filter(c => c !== categoryToDelete));

            if (activeCategory === categoryToDelete) {
                setActiveCategory('Все');
            }
            
            setConfirmingDelete(null);
            setDeletingCategory(null);

            try {
                await api.deleteCategory(categoryToDelete);
            } catch (e) {
                console.error("API Error deleting category");
            }
        }, 300);
    };
    
    if (!isOpen && !isClosing) return null;

    return (
        <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-opacity duration-200 ${isOpen ? 'bg-opacity-75' : 'bg-opacity-0'}`} onClick={handleClose}>
            <div className={`bg-brand-surface backdrop-blur-md border border-gray-700/20 rounded-xl shadow-lg w-11/12 max-w-md transition-all duration-200 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Управление категориями</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl transition-transform hover:scale-125">&times;</button>
                </header>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-2">
                        {categories.map(cat => (
                            <li key={cat} className={`flex justify-between items-center bg-brand-surface-solid/50 p-2 rounded-md transition-all duration-300 min-h-[44px] ${deletingCategory === cat ? 'list-item-exit' : 'list-item-enter'}`}>
                                {confirmingDelete === cat ? (
                                    <>
                                        <span className="text-sm text-red-400">Удалить категорию и все задачи?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => executeDelete(cat)} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Да</button>
                                            <button onClick={() => setConfirmingDelete(null)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded">Нет</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span>{cat}</span>
                                        {cat !== 'Общее' && cat !== 'General' && (
                                            <button onClick={() => setConfirmingDelete(cat)} className="text-gray-400 hover:text-red-500">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 border-t border-gray-700/50 flex items-center gap-2">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder="Имя новой категории..."
                        className="flex-grow bg-brand-surface-solid rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button onClick={handleAddCategory} className="bg-brand-primary text-white p-2 rounded-lg transition-transform hover:scale-110 active:scale-100">
                        <PlusIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;