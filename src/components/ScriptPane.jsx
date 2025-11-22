import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { TEMPLATES } from '../data/templates.js';

export default function ScriptPane({ script, setScript, onSplit, loading }) {
  const pickRandom = () => {
    const idx = Math.floor(Math.random() * TEMPLATES.length);
    setScript(TEMPLATES[idx]);
  };

  const canSplit = script.trim().length > 0;

  return (
    <div className="script-view">
      <div className="script-editor-container glass-panel">
        <div className="script-header">
          <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} className="text-accent" />
            我的剧本
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={pickRandom} className="btn btn-ghost">随机生成</button>
            <button onClick={onSplit} className={`btn ${canSplit ? (loading ? 'btn-disabled' : 'btn-primary') : 'btn-disabled'}`} disabled={!canSplit || loading} title={canSplit ? '' : '请先输入或生成剧本文本'}>
              <Sparkles size={14} />
              {loading ? '抽取角色中...' : '智能拆分分镜'}
            </button>
          </div>
        </div>
        <div className="script-info">说明：你可以直接粘贴或手动编写剧本；也可使用“随机生成”从模板快速开始。</div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="script-textarea"
          placeholder="在这里输入或粘贴你的剧本..."
        />
        <div className="script-footer">
          <div className="text-secondary">{script.length} / 3000</div>
        </div>
      </div>
    </div>
  );
}
