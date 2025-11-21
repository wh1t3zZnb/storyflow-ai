import React, { useState } from 'react';
import { Sparkles, X, Wand2 } from 'lucide-react';

export default function AIEditPopup({ isOpen, onClose, onSubmit, targetName }) {
  const [prompt, setPrompt] = useState('');
  if (!isOpen) return null;
  return (
    <div className="glass-panel" style={{ position: 'absolute', right: '40px', top: 0, zIndex: 50, width: '320px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>AI 智能修改</span>
        </div>
        <button onClick={onClose} className="btn-icon"><X size={14} /></button>
      </div>
      <p className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
        正在修改: <span style={{ color: 'white', fontWeight: 500 }}>{targetName}</span>
      </p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="输入修改指令" style={{ marginBottom: '12px', minHeight: '80px' }} />
      <button onClick={() => { onSubmit(prompt); setPrompt(''); }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        <Wand2 size={14} />
        开始生成
      </button>
    </div>
  );
}