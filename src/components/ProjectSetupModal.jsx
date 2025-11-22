import React, { useState, useEffect } from 'react';

export default function ProjectSetupModal({ open, onClose, onConfirm }) {
  const [ratio, setRatio] = useState(null); // '16:9' | '9:16'
  const [style, setStyle] = useState(null);

  useEffect(() => {
    if (open) {
      setRatio(null);
      setStyle('写实');
    }
  }, [open]);

  if (!open) return null;

  const styles = ['写实'];

  const confirmDisabled = !ratio || !style;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal" style={{ maxWidth: '560px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>项目设置</h3>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>视频比例</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={`btn ${ratio === '16:9' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRatio('16:9')}
              style={{ width: '180px', height: '80px', justifyContent: 'flex-start', gap: '8px' }}>
              <div style={{ width: '64px', height: '48px', borderRadius: '6px', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div>横屏</div>
                <div className="text-secondary" style={{ fontSize: '12px' }}>16:9</div>
              </div>
            </button>
            <button className={`btn ${ratio === '9:16' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRatio('9:16')}
              style={{ width: '180px', height: '80px', justifyContent: 'flex-start', gap: '8px' }}>
              <div style={{ width: '40px', height: '64px', borderRadius: '6px', background: 'linear-gradient(135deg, #93c5fd, #c084fc)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div>竖屏</div>
                <div className="text-secondary" style={{ fontSize: '12px' }}>9:16</div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>整体风格</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {styles.map(s => (
              <button key={s} className={`btn ${style === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStyle(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={confirmDisabled} onClick={() => onConfirm(ratio, style)}>下一步</button>
        </div>
      </div>
    </div>
  );
}