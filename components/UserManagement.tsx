
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onAddUser, onDeleteUser, theme, t }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.STAFF
  });

  const handleAdd = () => {
    if (!formData.name || !formData.username || !formData.password) return;
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      email: `${formData.username}@stockmaster.com`
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
  };

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t('userManagement')}</h2>
          <p className="text-slate-500">Manage access and inventory system personnel accounts.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
        >
          <i className="fas fa-user-plus"></i>
          <span>{t('registerUser')}</span>
        </button>
      </header>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              <tr>
                <th className="px-6 py-4">{t('fullName')}</th>
                <th className="px-6 py-4">{t('username')}</th>
                <th className="px-6 py-4">{t('role')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {users.map((u) => (
                <tr key={u.id} className={`group ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${
                        u.role === UserRole.ADMIN ? 'bg-rose-500' : u.role === UserRole.LEADER ? 'bg-indigo-500' : 'bg-slate-500'
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{u.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                      u.role === UserRole.ADMIN ? 'bg-rose-500/10 text-rose-500' :
                      u.role === UserRole.LEADER ? 'bg-indigo-500/10 text-indigo-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser.id && (
                      <button 
                        onClick={() => { if(window.confirm('Delete this account?')) onDeleteUser(u.id); }}
                        className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">{t('registerUser')}</h3>
              <button onClick={() => setShowAddModal(false)} className="opacity-60 hover:opacity-100 transition-opacity"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('fullName')}</label>
                <input className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('username')}</label>
                  <input className={inputClass} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('password')}</label>
                  <input type="password" className={inputClass} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('role')}</label>
                <select 
                  className={inputClass} 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  {/* Updated: Both Admin and Leader can create any role including Admin */}
                  <option value={UserRole.ADMIN}>ADMIN</option>
                  <option value={UserRole.LEADER}>LEADER</option>
                  <option value={UserRole.STAFF}>STAFF</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-6">
                <button onClick={() => setShowAddModal(false)} className={`flex-1 py-4 rounded-2xl font-black text-xs border ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-gray-100 text-gray-500'}`}>{t('cancel')}</button>
                <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">{t('addUser')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
