import React, { useState, useEffect } from 'react';

export default function SettingsModal({ open, initial, onClose, onSave }) {
  const [baseUrl, setBaseUrl] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (open) {
      setBaseUrl(initial?.baseUrl || 'https://openrouter.ai/api/v1/chat/completions');
      setModelId(initial?.modelId || 'google/gemini-2.5-flash');
      setApiKey(initial?.apiKey || '');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ baseUrl: baseUrl.trim(), modelId: modelId.trim(), apiKey: apiKey.trim() });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal">
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>API 设置</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base URL</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://openrouter.ai/api/v1/chat/completions" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Model ID</label>
            <input value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="google/gemini-2.5-flash" />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>API Key</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
          </div>
          <div className="text-secondary" style={{ fontSize: '12px' }}>提示：密钥保存在本地浏览器，仅用于本机调试。</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}