import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, LayoutGrid, List, Sparkles } from 'lucide-react';
import AIEditPopup from './AIEditPopup.jsx';
import EditableCell from './EditableCell.jsx';

export default function StoryboardPane({
  frames,
  updateFrame,
  aiPopupState,
  setAiPopupState,
  handleAIRequest,
  characters,
  onGeneratePreview,
  onUploadPreview,
  onGenerateAll,
  generating,
  generatingIds,
  displayRatio,
  stopping,
  onStop,
  onRegenerate
}) {
  const [viewMode] = useState('list');
  const [exportOpen, setExportOpen] = useState(() => {
    try {
      const s = localStorage.getItem('cache.storyboard.exportOpen');
      return s === 'true';
    } catch {
      return false;
    }
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const ratioValue = (() => {
    if (!displayRatio) return 1;
    const parts = String(displayRatio).split(':');
    if (parts.length === 2) {
      const w = Number(parts[0]) || 1;
      const h = Number(parts[1]) || 1;
      return w / h;
    }
    return 1;
  })();

  useEffect(() => { }, [viewMode]);

  useEffect(() => {
    try { localStorage.setItem('cache.storyboard.exportOpen', String(exportOpen)); } catch { }
  }, [exportOpen]);

  return (
    <div className="storyboard-view">
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> 列表视图
          </button>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="text-secondary" style={{ fontSize: '13px' }}>
            共 {frames.length} 个镜头 • 总时长 {frames.reduce((acc, f) => acc + f.duration, 0)}s
          </div>

          {generating ? (
            <>
              <button className="btn" disabled>{stopping ? '停止中…' : '正在生成…'}</button>
              {!stopping && (
                <button className="btn btn-ghost" onClick={onStop}>停止生成</button>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => onGenerateAll && onGenerateAll()}>批量生成预览</button>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button className="btn btn-ghost" onClick={() => setExportOpen(s => !s)}>导出</button>
                {exportOpen && (
                  <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '36px', minWidth: '180px', padding: '8px', zIndex: 10 }}>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { downloadXLSX(frames); setExportOpen(false); }}>导出 Excel (.xlsx)</button>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { downloadJSON(frames); setExportOpen(false); }}>导出 JSON</button>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { downloadFeishuBase(frames); setExportOpen(false); }}>导出飞书多维表格</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="storyboard-content">
        {
          (
            <table className="storyboard-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th style={{ width: '160px' }}>预览图</th>
                  <th style={{ width: '140px' }}>角色</th>
                  <th>画面描述</th>
                  <th>台词/音效</th>
                  <th style={{ width: '80px' }}>景别</th>
                  <th style={{ width: '80px' }}>运镜</th>
                  <th style={{ width: '70px' }}>时长</th>
                  <th style={{ width: '60px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {frames.map((frame) => (
                  <tr key={frame.id}>
                    <td style={{ fontWeight: 'bold' }}>{frame.scene}</td>
                    <td>
                      <div style={{ width: '160px', aspectRatio: ratioValue, borderRadius: '6px', background: 'var(--bg-secondary)', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {frame.imageUrl ? (
                          <img src={frame.imageUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => setPreviewUrl(frame.imageUrl)} />
                        ) : (
                          <div className="flex-center" style={{ width: '100%', height: '100%', color: 'var(--text-secondary)', fontSize: '12px' }}>
                            未生成
                          </div>
                        )}
                        {generatingIds && generatingIds.has && generatingIds.has(frame.id) && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="32" height="32" viewBox="0 0 50 50" aria-label="loading">
                              <circle cx="25" cy="25" r="20" stroke="white" strokeWidth="4" fill="none" strokeDasharray="90" strokeDashoffset="0">
                                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                              </circle>
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {String(frame.character || '')
                          .split(',')
                          .map(n => n.trim())
                          .filter(Boolean)
                          .map(name => (
                            <span key={name} style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '12px', background: 'var(--chip-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{name}</span>
                          ))}
                        {(!frame.character || String(frame.character).trim() === '') && (
                          <span className="text-secondary" style={{ fontSize: '12px' }}>无</span>
                        )}
                      </div>
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      <EditableCell multiline value={frame.content} onSave={(val) => updateFrame(frame.id, 'content', val)} />
                    </td>
                    <td style={{ minWidth: '180px', color: 'var(--text-secondary)' }}>
                      <EditableCell multiline value={frame.dialogue} onSave={(val) => updateFrame(frame.id, 'dialogue', val)} />
                    </td>
                    <td>
                      <EditableCell value={frame.shot} onSave={(val) => updateFrame(frame.id, 'shot', val)} />
                    </td>
                    <td>
                      <EditableCell value={frame.cameraMovement} onSave={(val) => updateFrame(frame.id, 'cameraMovement', val)} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EditableCell type="number" value={frame.duration} onSave={(val) => updateFrame(frame.id, 'duration', Number(val))} />
                        <span className="text-secondary" style={{ fontSize: '12px' }}>s</span>
                      </div>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <button className="btn-icon" onClick={() => setAiPopupState({ isOpen: true, frameId: frame.id })}>
                        <Sparkles size={14} />
                      </button>
                      {aiPopupState.isOpen && aiPopupState.frameId === frame.id && (
                        <AIEditPopup
                          isOpen={true}
                          targetName={`场号 ${frame.scene}`}
                          onClose={() => setAiPopupState({ isOpen: false, frameId: null })}
                          onSubmit={handleAIRequest}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
      {previewUrl && (
        <div className="modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div style={{ background: 'transparent' }} onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="preview" className="image-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}

function csvEscape(val) {
  const s = String(val ?? '');
  const needQuote = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needQuote ? `"${escaped}"` : escaped;
}

function buildRows(frames) {
  return frames.map(f => ({
    scene: f.scene,
    character: f.character || '',
    shot: f.shot,
    cameraAngle: f.cameraAngle,
    cameraMovement: f.cameraMovement,
    content: f.content,
    dialogue: f.dialogue || '',
    duration: f.duration,
    imageUrl: f.imageUrl || ''
  }));
}

function downloadJSON(frames) {
  const data = { frames: buildRows(frames) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storyboard_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadFeishuBase(frames) {
  const records = buildRows(frames).map(row => ({
    fields: {
      场号: row.scene,
      角色: row.character,
      景别: row.shot,
      角度: row.cameraAngle,
      运镜: row.cameraMovement,
      画面描述: row.content,
      台词音效: row.dialogue,
      时长: row.duration,
      预览图: row.imageUrl
    }
  }));
  const data = { records };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feishu_bitable_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadXLSX(frames) {
  const rows = buildRows(frames);
  const header = ['场号', '角色', '景别', '角度', '运镜', '画面描述', '台词/音效', '时长', '预览图'];
  const lines = [header.join(',')].concat(
    rows.map(r => [r.scene, r.character, r.shot, r.cameraAngle, r.cameraMovement, r.content, r.dialogue, r.duration, r.imageUrl].map(csvEscape).join(','))
  );
  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storyboard_${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}