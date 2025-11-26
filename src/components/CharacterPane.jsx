import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

export default function CharacterPane({ characters, onAdd, onEdit, banner, onProceed, proceedDisabled, loading }) {
  return (
    <div className="character-view h-full p-6 overflow-y-auto">
      {banner?.active && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex justify-between items-center shadow-lg shadow-blue-500/5">
          <div className="flex flex-col gap-1.5">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              已根据剧本生成 {banner.count} 个角色
            </div>
            <div className="flex gap-2 items-center">
              <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs text-gray-500">风格：{banner.style}</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs text-gray-500">比例：{banner.ratio}</span>
            </div>
          </div>
          <button
            className={`btn ${proceedDisabled || loading ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'btn-primary shadow-lg shadow-blue-500/20'}`}
            disabled={proceedDisabled || loading}
            onClick={onProceed}
          >
            {loading ? '拆分分镜中...' : '下一步：拆分分镜'}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          角色管理
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{characters.length}</span>
        </h2>
        <button className="btn btn-primary shadow-lg shadow-blue-500/20" onClick={onAdd}>
          <Plus size={16} />
          新建角色
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {characters.map(char => (
          <div
            key={char.id}
            className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all cursor-pointer flex gap-4 items-start hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
            onClick={() => onEdit(char)}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden ring-2 ring-gray-100 group-hover:ring-blue-500/50 transition-all shadow-lg"
              style={{ backgroundColor: char.avatarColor }}
            >
              {char.imageUrl ? (
                <img src={char.imageUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                char.name[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 truncate group-hover:text-blue-600 transition-colors">{char.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{char.desc}</p>
            </div>
          </div>
        ))}

        <div
          className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500/50 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center justify-center p-6 min-h-[140px] gap-3 text-gray-400 hover:text-blue-500 group"
          onClick={onAdd}
        >
          <div className="p-3 rounded-full bg-gray-100 group-hover:bg-blue-500/10 transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-medium">添加新角色</span>
        </div>
      </div>
    </div>
  );
}