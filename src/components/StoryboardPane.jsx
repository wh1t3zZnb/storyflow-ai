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
  const [viewMode, setViewMode] = useState('list');
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
    <div className="storyboard-view h-full flex flex-col">
      <div className="toolbar flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex gap-2">
          <button
            className={`btn ${viewMode === 'list' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'btn-ghost hover:bg-gray-100 text-gray-600'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} /> 列表视图
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            共 <span className="text-gray-900 font-medium">{frames.length}</span> 个镜头 • 总时长 <span className="text-gray-900 font-medium">{frames.reduce((acc, f) => acc + f.duration, 0)}s</span>
          </div>

          {generating ? (
            <>
              <button className="btn bg-gray-100 text-gray-400 cursor-not-allowed" disabled>{stopping ? '停止中…' : '正在生成…'}</button>
              {!stopping && (
                <button className="btn btn-ghost hover:bg-red-500/10 hover:text-red-500 text-red-400" onClick={onStop}>停止生成</button>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-primary shadow-lg shadow-blue-500/20" onClick={() => onGenerateAll && onGenerateAll()}>批量生成预览</button>
              <div className="relative inline-block">
                <button className="btn btn-ghost hover:bg-gray-100 text-gray-600" onClick={() => setExportOpen(s => !s)}>导出</button>
                {exportOpen && (
                  <div className="absolute right-0 top-full mt-2 min-w-[180px] p-1.5 rounded-xl bg-white border border-gray-200 shadow-xl z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                    <button className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-left" onClick={() => { downloadXLSX(frames); setExportOpen(false); }}>导出 Excel (.xlsx)</button>
                    <button className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-left" onClick={() => { downloadJSON(frames); setExportOpen(false); }}>导出 JSON</button>
                    <button className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-left" onClick={() => { downloadFeishuBase(frames); setExportOpen(false); }}>导出飞书多维表格</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="storyboard-content flex-1 overflow-y-auto p-6">
        {
          (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[60px]">#</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[180px]">预览图</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[150px]">角色</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">画面描述</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">台词/音效</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[90px]">景别</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[90px]">运镜</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[80px]">时长</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium w-[70px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {frames.map((frame) => (
                  <tr key={frame.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-500 group-hover:text-gray-900">{frame.scene}</td>
                    <td className="py-4 px-4">
                      <div className="w-[160px] rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative group/img" style={{ aspectRatio: ratioValue }}>
                        {frame.imageUrl ? (
                          <img src={frame.imageUrl} alt="thumb" className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover/img:scale-105" onClick={() => setPreviewUrl(frame.imageUrl)} />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
                            未生成
                          </div>
                        )}
                        {generatingIds && generatingIds.has && generatingIds.has(frame.id) && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <svg width="24" height="24" viewBox="0 0 50 50" aria-label="loading">
                              <circle cx="25" cy="25" r="20" stroke="white" strokeWidth="4" fill="none" strokeDasharray="90" strokeDashoffset="0">
                                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                              </circle>
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {String(frame.character || '')
                          .split(',')
                          .map(n => n.trim())
                          .filter(Boolean)
                          .map(name => (
                            <span key={name} className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-xs text-gray-600">{name}</span>
                          ))}
                        {(!frame.character || String(frame.character).trim() === '') && (
                          <span className="text-gray-400 text-xs">无</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[220px] text-gray-800">
                      <EditableCell multiline value={frame.content} onSave={(val) => updateFrame(frame.id, 'content', val)} />
                    </td>
                    <td className="py-4 px-4 min-w-[180px] text-gray-500">
                      <EditableCell multiline value={frame.dialogue} onSave={(val) => updateFrame(frame.id, 'dialogue', val)} />
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      <EditableCell value={frame.shot} onSave={(val) => updateFrame(frame.id, 'shot', val)} />
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      <EditableCell value={frame.cameraMovement} onSave={(val) => updateFrame(frame.id, 'cameraMovement', val)} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-gray-700">
                        <EditableCell type="number" value={frame.duration} onSave={(val) => updateFrame(frame.id, 'duration', Number(val))} />
                        <span className="text-gray-400 text-xs">s</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 relative">
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        onClick={() => setAiPopupState({ isOpen: true, frameId: frame.id })}
                        title="AI 编辑"
                      >
                        <Sparkles size={16} />
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
        <div className="modal-overlay z-[2000]" onClick={() => setPreviewUrl(null)}>
          <div className="bg-transparent p-4" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="preview" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl ring-1 ring-white/10" />
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