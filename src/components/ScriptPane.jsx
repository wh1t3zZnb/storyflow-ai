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
    <div className="script-view h-full p-6">
      <div className="script-editor-container flex flex-col h-full rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="script-header flex items-center justify-between p-4 border-b border-gray-100 bg-white/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <BookOpen size={18} />
            </div>
            我的剧本
          </h2>
          <div className="flex gap-2">
            <button onClick={pickRandom} className="btn btn-ghost hover:bg-gray-100 text-gray-600 text-sm">随机生成</button>
            <button
              onClick={onSplit}
              className={`btn ${canSplit ? (loading ? 'opacity-50 cursor-not-allowed' : 'btn-primary shadow-lg shadow-blue-500/20') : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'}`}
              disabled={!canSplit || loading}
              title={canSplit ? '' : '请先输入或生成剧本文本'}
            >
              <Sparkles size={14} />
              {loading ? '抽取角色中...' : '智能拆分分镜'}
            </button>
          </div>
        </div>

        <div className="px-6 py-3 text-xs text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
          说明：你可以直接粘贴或手动编写剧本；也可使用“随机生成”从模板快速开始。
        </div>

        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="script-textarea flex-1 w-full bg-transparent border-none p-6 resize-none text-base leading-relaxed font-mono text-gray-800 focus:ring-0 focus:outline-none placeholder-gray-400"
          placeholder="在这里输入或粘贴你的剧本..."
        />

        <div className="script-footer p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="text-xs text-gray-500 font-mono bg-gray-200/50 px-2 py-1 rounded-md">
            {script.length} / 3000
          </div>
        </div>
      </div>
    </div>
  );
}
