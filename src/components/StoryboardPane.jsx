import React, { useState } from 'react';
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
  onGenerateAll
}) {
  const [viewMode, setViewMode] = useState('list');

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
          <button
            className={`btn ${viewMode === 'board' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid size={16} /> 卡片视图
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="text-secondary" style={{ fontSize: '13px' }}>
            共 {frames.length} 个镜头 • 总时长 {frames.reduce((acc, f) => acc + f.duration, 0)}s
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onGenerateAll && onGenerateAll()}
          >
            批量生成预览
          </button>
        </div>
      </div>

      <div className="storyboard-content">
        {viewMode === 'list' ? (
          <table className="storyboard-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ width: '160px' }}>预览图</th>
                <th>画面描述</th>
                <th>台词/音效</th>
                <th style={{ width: '80px' }}>运镜</th>
                <th style={{ width: '80px' }}>景别</th>
                <th style={{ width: '80px' }}>角度</th>
                <th style={{ width: '70px' }}>时长</th>
                <th style={{ width: '60px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((frame) => (
                <tr key={frame.id}>
                  <td style={{ fontWeight: 'bold' }}>{frame.scene}</td>
                  <td>
                    <div style={{ width: '140px', height: '80px', borderRadius: '6px', background: '#000', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {frame.imageUrl ? (
                        <img src={frame.imageUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="flex-center" style={{ width: '100%', height: '100%', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          未生成
                        </div>
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
                    <EditableCell value={frame.cameraMovement} onSave={(val) => updateFrame(frame.id, 'cameraMovement', val)} />
                  </td>
                  <td>
                    <EditableCell value={frame.shot} onSave={(val) => updateFrame(frame.id, 'shot', val)} />
                  </td>
                  <td>
                    <EditableCell value={frame.cameraAngle} onSave={(val) => updateFrame(frame.id, 'cameraAngle', val)} />
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
        ) : (
          <div className="storyboard-grid">
            {frames.map((frame) => (
              <div key={frame.id} className="storyboard-card">
                <div className="card-image">
                  {frame.imageUrl ? (
                    <img src={frame.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <div style={{ fontSize: '12px' }}>未生成预览图</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: 'white' }}>
                    Sc {frame.scene}
                  </div>
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{frame.shot}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{frame.cameraAngle}</span>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>{frame.character}</span>
                    <span className="text-secondary" style={{ fontSize: '12px' }}>{frame.duration}s</span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '12px', height: '42px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {frame.content}
                  </p>
                  <div className="text-secondary" style={{ fontSize: '13px', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>
                    {frame.dialogue || '无对白'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}