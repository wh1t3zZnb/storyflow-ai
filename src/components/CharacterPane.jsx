import React from 'react';
import { Plus } from 'lucide-react';

export default function CharacterPane({ characters, onAdd, onEdit, banner, onProceed, proceedDisabled, loading }) {
  return (
    <div className="character-view">
      {banner?.active && (
        <div className="glass-panel" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>已根据剧本生成 {banner.count} 个角色</div>
            <div className="text-secondary" style={{ fontSize: '12px' }}>风格：{banner.style} • 比例：{banner.ratio}</div>
          </div>
          <button className={`btn ${proceedDisabled || loading ? 'btn-disabled' : 'btn-primary'}`} disabled={proceedDisabled || loading} onClick={onProceed}>{loading ? '拆分分镜中...' : '下一步：拆分分镜'}</button>
      </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>角色管理 ({characters.length})</h2>
        <button className="btn btn-primary" onClick={onAdd}><Plus size={16} />新建角色</button>
      </div>
      <div className="character-grid">
        {characters.map(char => (
          <div key={char.id} className="glass-panel character-card" onClick={() => onEdit(char)}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: char.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
              {char.imageUrl ? (
                <img src={char.imageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                char.name[0]
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{char.name}</h3>
              <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>{char.desc}</p>
            </div>
          </div>
        ))}
        <div className="add-character-card" onClick={onAdd}>
          <Plus size={32} style={{ marginBottom: '8px' }} />
          <span>添加新角色</span>
        </div>
      </div>
    </div>
  );
}