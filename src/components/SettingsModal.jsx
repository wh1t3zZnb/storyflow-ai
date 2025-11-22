import React, { useState, useEffect } from 'react';

export default function SettingsModal({ open, initial, onClose, onSave }) {
  const [mode, setMode] = useState('text'); // 'text' | 'image'
  const [baseUrl, setBaseUrl] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [imageBaseUrl, setImageBaseUrl] = useState('');
  const [imageModelId, setImageModelId] = useState('');
  const [imageApiKey, setImageApiKey] = useState('');

  useEffect(() => {
    if (open) {
      setBaseUrl(initial?.baseUrl || 'https://openrouter.ai/api/v1/chat/completions');
      setModelId(initial?.modelId || 'google/gemini-2.5-flash');
      setApiKey(initial?.apiKey || '');
      setImageBaseUrl(initial?.imageBaseUrl || initial?.baseUrl || 'https://openrouter.ai/api/v1/chat/completions');
      setImageModelId(initial?.imageModelId || 'google/gemini-2.5-flash-image');
      setImageApiKey(initial?.imageApiKey || initial?.apiKey || '');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    onSave({
      baseUrl: baseUrl.trim(),
      modelId: modelId.trim(),
      apiKey: apiKey.trim(),
      imageBaseUrl: imageBaseUrl.trim(),
      imageModelId: imageModelId.trim(),
      imageApiKey: imageApiKey.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal">
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>API 设置</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('text')}>文本模型</button>
          <button className={`btn ${mode === 'image' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('image')}>图片模型</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Base URL</label>
            {mode === 'text' ? (
              <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://openrouter.ai/api/v1/chat/completions" />
            ) : (
              <input value={imageBaseUrl} onChange={(e) => setImageBaseUrl(e.target.value)} placeholder="https://openrouter.ai/api/v1/chat/completions" />
            )}
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Model ID</label>
            {mode === 'text' ? (
              <input value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="google/gemini-2.5-flash" />
            ) : (
              <input value={imageModelId} onChange={(e) => setImageModelId(e.target.value)} placeholder="google/gemini-2.5-flash-image" />
            )}
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>API Key</label>
            {mode === 'text' ? (
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
            ) : (
              <input type="password" value={imageApiKey} onChange={(e) => setImageApiKey(e.target.value)} placeholder="sk-..." />
            )}
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