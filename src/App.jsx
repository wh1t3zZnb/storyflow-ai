import React, { useState, useRef, useEffect } from 'react';
import {
    Clapperboard,
    Image as ImageIcon,
    Plus,
    Sparkles,
    LayoutGrid,
    List,
    Check,
    X,
    BookOpen,
    Users,
    Film,
    Settings
} from 'lucide-react';
import { createMockImage } from './utils/mockImage.js';
import ScriptPane from './components/ScriptPane.jsx';
import CharacterPane from './components/CharacterPane.jsx';
import StoryboardPane from './components/StoryboardPane.jsx';
import ProjectSetupModal from './components/ProjectSetupModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { loadApiConfig, saveApiConfig } from './utils/apiConfig.js';
import { extractRoles, splitStoryboard, normalizeRoles, normalizeFrames } from './utils/llm.js';

import { generateCharacterImage, generateStoryboardImage } from './utils/imageGeneration.js';
import { AlertModal, ConfirmModal } from './components/CommonModals.jsx';

// --- Data ---

// --- Components ---

const EditableCell = ({ value, onSave, type = 'text', multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        onSave(tempValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setTempValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div style={{ position: 'relative', width: '100%' }}>
                {multiline ? (
                    <textarea
                        ref={inputRef}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%', minHeight: '60px', resize: 'none' }}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type={type}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                    />
                )}
                <div style={{ position: 'absolute', right: '4px', bottom: '4px' }}>
                    <button onMouseDown={handleSave} style={{ padding: '2px', background: 'var(--success)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', display: 'flex' }}>
                        <Check size={12} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer', padding: '4px', minHeight: '24px', display: 'flex', alignItems: 'center' }}
            className="editable-cell-hover"
        >
            {value || <span className="text-secondary" style={{ fontStyle: 'italic', fontSize: '12px' }}>点击编辑...</span>}
        </div>
    );
};

const AIEditPopup = ({ isOpen, onClose, onSubmit, targetName }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    return (
        <div className="glass-panel" style={{
            position: 'absolute',
            right: '40px',
            top: '0',
            zIndex: 50,
            width: '320px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                    <Sparkles size={16} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>AI 智能修改</span>
                </div>
                <button onClick={onClose} className="btn-icon">
                    <X size={14} />
                </button>
            </div>
            <p className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                正在修改: <span style={{ color: 'white', fontWeight: '500' }}>{targetName}</span>
            </p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="告诉 AI 你想怎么改... (例如：把语气变得更冷酷一点)"
                style={{ marginBottom: '12px', minHeight: '80px' }}
            />
            <button
                onClick={() => {
                    onSubmit(prompt);
                    setPrompt('');
                }}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
            >
                <Wand2 size={14} />
                开始生成
            </button>
        </div>
    );
};

// --- Views ---

const ScriptView = ({ script, setScript, onSplit }) => {
    const templates = [
        '《雨夜便利店》\n\n雨水在霓虹灯下落成细线，便利店门口的风铃偶尔轻响。黑雨衣男人在玻璃门外停住，透过起雾的窗看见柜台后的店员打着盹。门被推开，铃声叮当，湿气卷进暖黄的灯光。男人把湿漉漉的手伸进口袋，掏出一枚被磨得发亮的硬币。\n\n“有万宝路吗？”他的声音像雨夜里被剪短的影子。店员抬头，眼睛里还带着睡意：“只有软盒。”男人点头。外面水坑里掠过一条灯影像鱼尾。',
        '《公寓猫影》\n\n午夜过后，走廊的灯像慢慢褪色的月亮。女主人的房门缝里蹿过去一团影子，她以为是邻居家的猫。她把耳朵贴在门上，听到楼下垃圾道里传来轻微的玻璃碰撞声，像某种小动物把自己关进了瓶中。她忽然想到傍晚看见的那只橘猫，它在电梯里趴着，眼神像在等谁。\n\n“谁在那儿？”她压低嗓子问，风从窗缝里吹进来，卷起餐桌上的纸片。',
        'INT. 地铁终点站 - 夜\n\n月台空荡。末班车减速进站，刹车声像远处的雷。年轻人对着玻璃整理外套，倒影里是一张比他更疲惫的脸。列车停下，门打开，他没有上车。广播里重复着一句话：请不要逗留。\n\n他拿起手机，屏幕亮起又熄灭。一个无人问候的夜晚把他裹住，从天花的风口吹下来的冷气像细针。',
        '《失物招领》第一人称\n\n我把雨伞忘在了旧书店。回去的时候，晚街已经被水打碎成许多小片，我的倒影在其中拼不起来。店里只剩下老板，他把伞递给我：“你又忘了。”我看见柜台边有一只纸箱，箱子里是被人遗落的东西——两只耳机、一个写着“海”的明信片、和一条会发光的塑料鱼。\n\n我忽然觉得，记忆也是失物，需要领回。',
        '《荒野信号》抒情体\n\n风把草地铺成一张粗糙的毯子，天边的红光像一盏迟到的灯。旧对讲机忽然噼啪作响，信号像从远方的井口被丢下来。有人在说话，但每一个词都被风带走一半，只剩下骨架。少年抬起头时，脸上的尘土在月光下变成了细小的星。',
        '《海边小屋》\n\n浪拍打木台阶，屋内的灯在玻璃里摇晃。孩子在桌上摊开地图和贝壳，试图用线把海的形状圈住。父亲在窗边修理旧相机，镜头里有一颗干净的盐。夜色像从海上走来的巨人，门外传来三下敲击，间隔很准，像远洋船的信号。'
    ];

    const pickRandom = () => {
        const idx = Math.floor(Math.random() * templates.length);
        setScript(templates[idx]);
    };

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            setScript(text);
        };
        reader.readAsText(file, 'utf-8');
    };

    return (
        <div className="script-view">
            <div className="script-editor-container glass-panel">
                <div className="script-header">
                    <h2 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} className="text-accent" />
                        我的剧本
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                            上传剧本
                            <input type="file" accept="text/plain" onChange={handleUpload} style={{ display: 'none' }} />
                        </label>
                        <button onClick={pickRandom} className="btn btn-ghost">
                            随机生成
                        </button>
                        <button onClick={onSplit} className="btn btn-primary">
                            <Sparkles size={14} />
                            智能拆分分镜
                        </button>
                    </div>
                </div>
                <div className="script-info">
                    说明：你可以直接粘贴或上传现有剧本；也可使用“随机生成”从模板快速开始。AI 写作助手已移除，支持完全手动创作与编辑。
                </div>
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
};

const CharacterView = ({ characters, onAdd, onEdit }) => {
    return (
        <div className="character-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>角色管理 ({characters.length})</h2>
                <button className="btn btn-primary" onClick={onAdd}>
                    <Plus size={16} />
                    新建角色
                </button>
            </div>

            <div className="character-grid">
                {characters.map(char => (
                    <div key={char.id} className="glass-panel character-card" onClick={() => onEdit(char)}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: char.avatarColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: 'white',
                                flexShrink: 0,
                                overflow: 'hidden'
                            }}
                        >
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
};

const StoryboardView = ({ frames, updateFrame, aiPopupState, setAiPopupState, handleAIRequest, characters, onGeneratePreview, onUploadPreview }) => {
    const [viewMode, setViewMode] = useState('list');

    return (
        <div className="storyboard-view">
            {/* Toolbar */}
            <div className="toolbar">
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
                <div className="text-secondary" style={{ fontSize: '13px' }}>
                    共 {frames.length} 个镜头 • 总时长 {frames.reduce((acc, f) => acc + f.duration, 0)}s
                </div>
            </div>

            {/* Content */}
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
                                            <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: '4px' }}>
                                                <label className="btn btn-ghost" style={{ padding: '2px 6px' }}>
                                                    上传
                                                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onUploadPreview(frame.id, e.target.files[0])} style={{ display: 'none' }} />
                                                </label>
                                                <button className="btn btn-primary" style={{ padding: '2px 6px' }} onClick={() => onGeneratePreview(frame.id)}>
                                                    生成
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ minWidth: '220px' }}><EditableCell multiline value={frame.content} onSave={(val) => updateFrame(frame.id, 'content', val)} /></td>
                                    <td style={{ minWidth: '180px', color: 'var(--text-secondary)' }}><EditableCell multiline value={frame.dialogue} onSave={(val) => updateFrame(frame.id, 'dialogue', val)} /></td>
                                    <td><EditableCell value={frame.cameraMovement} onSave={(val) => updateFrame(frame.id, 'cameraMovement', val)} /></td>
                                    <td><EditableCell value={frame.shot} onSave={(val) => updateFrame(frame.id, 'shot', val)} /></td>
                                    <td><EditableCell value={frame.cameraAngle} onSave={(val) => updateFrame(frame.id, 'cameraAngle', val)} /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <EditableCell type="number" value={frame.duration} onSave={(val) => updateFrame(frame.id, 'duration', Number(val))} />
                                            <span className="text-secondary" style={{ fontSize: '12px' }}>s</span>
                                        </div>
                                    </td>
                                    <td style={{ position: 'relative' }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => setAiPopupState({ isOpen: true, frameId: frame.id })}
                                        >
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
                                <div className="card-image" onClick={() => !frame.imageUrl && onGeneratePreview(frame.id)}>
                                    {frame.imageUrl ? (
                                        <img src={frame.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            <ImageIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                            <div style={{ fontSize: '12px' }}>点击生成预览图</div>
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
};

// --- Main App ---

function App() {
    const [activeTab, setActiveTab] = useState('script');
    const [script, setScript] = useState('');
    const [frames, setFrames] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [aiPopupState, setAiPopupState] = useState({ isOpen: false, frameId: null });
    const [charModal, setCharModal] = useState({ open: false, initial: null });
    const [workflowStep, setWorkflowStep] = useState('script'); // 'script' | 'setup' | 'roles' | 'frames'
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apiConfig, setApiConfig] = useState(loadApiConfig());
    const [projectSetup, setProjectSetup] = useState({ open: false, ratio: null, style: null });
    const [bannerInfo, setBannerInfo] = useState({ active: false, count: 0, ratio: null, style: null });
    const [loadingExtract, setLoadingExtract] = useState(false);
    const [loadingSplit, setLoadingSplit] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatingIds, setGeneratingIds] = useState(new Set());
    const [cancelGeneration, setCancelGeneration] = useState(false);
    const cancelRef = useRef(false);
    const [stopping, setStopping] = useState(false);
    const [genAbortController, setGenAbortController] = useState(null);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert', // 'alert' | 'confirm'
        title: '',
        message: '',
        onConfirm: null,
        isDangerous: false,
        alertType: 'info'
    });

    const showAlert = (message, title = '提示', type = 'info') => {
        setModal({ isOpen: true, type: 'alert', title, message, alertType: type });
    };

    const showConfirm = (message, onConfirm, title = '确认', isDangerous = false) => {
        setModal({ isOpen: true, type: 'confirm', title, message, onConfirm, isDangerous });
    };

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    const globalLoadingMsg = (
        loadingExtract ? '正在抽取角色…' :
            loadingSplit ? '正在拆分分镜…' :
                null
    );
    const CACHE_KEYS = {
        script: 'cache.script',
        frames: 'cache.frames',
        characters: 'cache.characters',
        activeTab: 'cache.activeTab',
        workflowStep: 'cache.workflowStep',
        projectSetup: 'cache.projectSetup',
        bannerInfo: 'cache.bannerInfo'
    };

    useEffect(() => {
        try {
            const s = localStorage.getItem(CACHE_KEYS.script);
            const f = localStorage.getItem(CACHE_KEYS.frames);
            const c = localStorage.getItem(CACHE_KEYS.characters);
            const t = localStorage.getItem(CACHE_KEYS.activeTab);
            const w = localStorage.getItem(CACHE_KEYS.workflowStep);
            const p = localStorage.getItem(CACHE_KEYS.projectSetup);
            const b = localStorage.getItem(CACHE_KEYS.bannerInfo);
            if (s) setScript(s);
            if (f) {
                const parsedF = JSON.parse(f);
                if (Array.isArray(parsedF)) setFrames(parsedF);
            }
            if (c) {
                const parsedC = JSON.parse(c);
                if (Array.isArray(parsedC)) setCharacters(parsedC);
            }
            if (t && (t === 'script' || t === 'characters' || t === 'storyboard')) setActiveTab(t);
            if (w && (w === 'script' || w === 'roles' || w === 'frames')) setWorkflowStep(w);
            if (p) {
                const parsedP = JSON.parse(p);
                if (parsedP && typeof parsedP === 'object') setProjectSetup({ open: false, ratio: parsedP.ratio ?? null, style: parsedP.style ?? null });
            }
            if (b) {
                const parsedB = JSON.parse(b);
                if (parsedB && typeof parsedB === 'object') setBannerInfo(parsedB);
            }
        } catch { }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            try {
                localStorage.setItem(CACHE_KEYS.script, script || '');
                localStorage.setItem(CACHE_KEYS.frames, JSON.stringify(frames));
                localStorage.setItem(CACHE_KEYS.characters, JSON.stringify(characters));
                localStorage.setItem(CACHE_KEYS.activeTab, activeTab || 'script');
                localStorage.setItem(CACHE_KEYS.workflowStep, workflowStep || 'script');
                localStorage.setItem(CACHE_KEYS.projectSetup, JSON.stringify({ ratio: projectSetup.ratio ?? null, style: projectSetup.style ?? null }));
                localStorage.setItem(CACHE_KEYS.bannerInfo, JSON.stringify(bannerInfo));
            } catch { }
        }, 300);
        return () => clearTimeout(t);
    }, [script, frames, characters, activeTab, workflowStep, projectSetup.ratio, projectSetup.style, bannerInfo]);

    const updateFrame = (id, field, value) => {
        setFrames(frames.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleAIRequest = (prompt) => {
        console.log(`AI Request: ${prompt}`);
        setAiPopupState({ isOpen: false, frameId: null });
    };

    const handleExtractRoles = async () => {
        try {
            setLoadingExtract(true)
            const res = await extractRoles({ script })
            const roles = normalizeRoles(res?.roles)
            if (roles.length === 0) throw new Error('未返回角色')
            const mapped = roles
            setCharacters(mapped)
            setBannerInfo({ active: true, count: mapped.length, ratio: null, style: null })
            setWorkflowStep('roles')
            setActiveTab('characters')
        } catch (e) {
            showAlert(`角色抽取失败：${e.message}`, '错误', 'error')
        } finally {
            setLoadingExtract(false)
        }
    }

    const mockExtractCharacters = (text) => {
        const nameMatches = Array.from(text.matchAll(/([\u4e00-\u9fa5]{1,8})(：|:)/g)).map(m => m[1]);
        const unique = Array.from(new Set(nameMatches)).filter(n => n.length > 0);
        if (unique.length === 0) return ['主角', '旁白'];
        return unique.slice(0, 6);
    };

    const handleConfirmSetup = async (ratio, style) => {
        setProjectSetup({ open: false, ratio, style })
        try {
            setLoadingSplit(true)
            const roleNames = characters.map(c => ({ name: c.name, styleTags: c.styleTags }))
            const res = await splitStoryboard({ script, ratio, style, roles: roleNames })
            let mapped = normalizeFrames(res?.frames)
            const roleSet = new Set(characters.map(c => c.name))
            const roleList = characters.map(c => c.name)
            const mapToKnown = (rawNames) => {
                const out = []
                rawNames.forEach(n => {
                    if (!n) return
                    const t = n.trim()
                    if (roleSet.has(t)) { out.push(t); return }
                    // 模糊匹配：按汉字重合度 ≥2 或包含关系匹配到已定义角色
                    const chars = Array.from(t)
                    let best = null, bestScore = 0
                    roleList.forEach(rn => {
                        const setA = new Set(chars)
                        const setB = new Set(Array.from(rn))
                        let overlap = 0
                        setA.forEach(ch => { if (setB.has(ch)) overlap++ })
                        // 包含关系提升分数
                        if (t.includes(rn) || rn.includes(t)) overlap += 2
                        if (overlap > bestScore) { bestScore = overlap; best = rn }
                    })
                    if (best && bestScore >= 2) out.push(best)
                })
                // 去重
                return Array.from(new Set(out))
            }
            mapped = mapped.map(f => {
                const names = String(f.character || '').split(',').map(n => n.trim()).filter(Boolean)
                const matched = mapToKnown(names)
                // 若全部无法匹配，但原始分镜确实写了角色名，则保留原始，以便前端展示与生成参考
                const finalNames = matched.length > 0 ? matched : names
                return { ...f, character: finalNames.join(',') }
            })
            if (mapped.length === 0) throw new Error('未返回分镜')
            setFrames(mapped)
            setBannerInfo({ active: true, count: characters.length, ratio, style })
            setWorkflowStep('frames')
            setActiveTab('storyboard')
        } catch (e) {
            showAlert(`分镜拆分失败：${e.message}`, '错误', 'error')
        } finally {
            setLoadingSplit(false)
        }
    }

    const startBatchGeneration = async (framesToGenerate) => {
        // 串行生成,避免API并发限制
        setGenerating(true);

        setCancelGeneration(false);
        cancelRef.current = false;
        setStopping(false);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < framesToGenerate.length; i++) {
            const frame = framesToGenerate[i];
            const progress = `[${i + 1}/${framesToGenerate.length}]`;

            console.log(`${progress} 正在生成场景 ${frame.scene}...`);

            try {
                if (cancelRef.current) break;
                // 获取全局风格(从projectSetup或bannerInfo)
                const globalStyle = bannerInfo.style || projectSetup.style || '写实摄影';
                const ratio = bannerInfo.ratio || projectSetup.ratio || '1:1';

                // 调用API生成图片
                setGeneratingIds(prev => new Set(prev).add(frame.id));
                const controller = new AbortController();
                setGenAbortController(controller);
                const result = await generateStoryboardImage(frame, characters, globalStyle, ratio, controller.signal);

                if (result.success) {
                    // 更新该分镜的图片
                    setFrames(prev => prev.map(f =>
                        f.id === frame.id ? { ...f, imageUrl: result.imageUrl } : f
                    ));
                    successCount++;
                    console.log(`${progress} 场景 ${frame.scene} 生成成功`);
                } else {
                    const msg = String(result.error || '');
                    if (/aborted|AbortError/i.test(msg)) {
                        console.warn(`${progress} 已停止，当前请求已中断`);
                        break;
                    } else {
                        failCount++;
                        console.error(`${progress} 场景 ${frame.scene} 生成失败:`, result.error);
                    }
                }
            } catch (error) {
                const msg = String(error?.message || '');
                if (/aborted|AbortError/i.test(msg)) {
                    console.warn(`${progress} 已停止，当前请求已中断`);
                    break;
                } else {
                    failCount++;
                    console.error(`${progress} 场景 ${frame.scene} 生成失败:`, error);
                }
            } finally {
                setGeneratingIds(prev => {
                    const next = new Set(prev);
                    next.delete(frame.id);
                    return next;
                });
                setGenAbortController(null);
            }

            // 每生成一个,延迟一小段时间避免API限流
            if (i < framesToGenerate.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        setGenerating(false);
        setStopping(false);

        if (cancelRef.current) {
            showAlert(`已停止生成!\n成功: ${successCount} 个\n失败: ${failCount} 个`);
        } else {
            showAlert(`生成完成!\n成功: ${successCount} 个\n失败: ${failCount} 个`, '完成', 'success');
        }
    };

    const handleGenerateAllPreviews = () => {
        // 过滤出还没有生成图片的分镜
        const framesToGenerate = frames.filter(f => !f.imageUrl);

        if (framesToGenerate.length === 0) {
            showAlert('所有分镜都已生成预览图');
            return;
        }

        const runGeneration = () => {
            showConfirm(
                `将生成 ${framesToGenerate.length} 个分镜的预览图,预计需要 ${Math.ceil(framesToGenerate.length * 20 / 60)} 分钟,是否继续?`,
                () => startBatchGeneration(framesToGenerate)
            );
        };

        // 检查角色是否有图片
        const missingImageChars = characters.filter(c => !c.imageUrl);
        if (missingImageChars.length > 0) {
            const names = missingImageChars.map(c => c.name).join('、');
            showConfirm(
                `以下角色缺少参考图：\n${names}\n\n这可能会导致画面中人物长相不一致。\n是否继续生成？`,
                runGeneration,
                '风险提示',
                true
            );
        } else {
            runGeneration();
        }
    };

    const handleAddCharacter = () => {
        setCharModal({ open: true, initial: null });
    };

    const handleEditCharacter = (char) => {
        setCharModal({ open: true, initial: char });
    };

    const handleSaveCharacter = (data) => {
        setCharacters(prev => {
            const exists = prev.some(c => c.id === data.id);
            return exists ? prev.map(c => (c.id === data.id ? data : c)) : [...prev, data];
        });
        setCharModal({ open: false, initial: null });
    };

    const handleGeneratePreview = (id) => {
        setFrames(prev => prev.map(f => (
            f.id === id ? { ...f, imageUrl: createMockImage((f.content || `场 ${f.scene}`).slice(0, 30)) } : f
        )));
    };

    const handleUploadPreview = (id, file) => {
        const url = URL.createObjectURL(file);
        setFrames(prev => prev.map(f => (f.id === id ? { ...f, imageUrl: url } : f)));
    };

    return (
        <div className="app-container">

            {/* Workflow Navigation Bar */}
            <header className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--accent)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                        <Clapperboard size={18} color="white" />
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.5px' }}>STORYBOARD PRO</span>
                </div>

                <div className="nav-tabs" style={{ background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setActiveTab('script')}
                        className={`nav-tab-item ${activeTab === 'script' ? 'active' : ''}`}
                    >
                        <BookOpen size={14} /> 剧本
                    </button>
                    <button
                        onClick={() => workflowStep !== 'script' && setActiveTab('characters')}
                        className={`nav-tab-item ${activeTab === 'characters' ? 'active' : ''} ${workflowStep === 'script' ? 'disabled' : ''}`}
                    >
                        <Users size={14} /> 角色
                    </button>
                    <button
                        onClick={() => workflowStep === 'frames' && setActiveTab('storyboard')}
                        className={`nav-tab-item ${activeTab === 'storyboard' ? 'active' : ''} ${workflowStep !== 'frames' ? 'disabled' : ''}`}
                    >
                        <Film size={14} /> 分镜
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="btn btn-ghost" onClick={() => {
                        showConfirm(
                            '将清空剧本、角色、分镜并重置项目设置，是否继续？',
                            () => {
                                try {
                                    localStorage.removeItem('cache.script');
                                    localStorage.removeItem('cache.frames');
                                    localStorage.removeItem('cache.characters');
                                    localStorage.removeItem('cache.activeTab');
                                    localStorage.removeItem('cache.workflowStep');
                                    localStorage.removeItem('cache.projectSetup');
                                    localStorage.removeItem('cache.bannerInfo');
                                    localStorage.removeItem('cache.storyboard.viewMode');
                                    localStorage.removeItem('cache.storyboard.exportOpen');
                                } catch { }
                                setScript('');
                                setCharacters([]);
                                setFrames([]);
                                setActiveTab('script');
                                setWorkflowStep('script');
                                setProjectSetup({ open: false, ratio: null, style: null });
                                setBannerInfo({ active: false, count: 0, ratio: null, style: null });
                                setAiPopupState({ isOpen: false, frameId: null });
                                setCharModal({ open: false, initial: null });
                                showAlert('已清空并重置', '重置成功', 'success');
                            },
                            '确认重置',
                            true
                        );
                    }}>
                        重新生成
                    </button>
                    <button className="btn btn-ghost" onClick={() => setSettingsOpen(true)}>
                        <Settings size={16} />
                        设置
                    </button>
                </div>
            </header>

            {/* Setup Modal */}
            <ProjectSetupModal
                open={projectSetup.open}
                onClose={() => setProjectSetup(s => ({ ...s, open: false }))}
                onConfirm={handleConfirmSetup}
            />

            <SettingsModal
                open={settingsOpen}
                initial={apiConfig}
                onClose={() => setSettingsOpen(false)}
                onSave={(cfg) => { saveApiConfig(cfg); setApiConfig(cfg); setSettingsOpen(false); }}
            />

            {/* Main Workspace */}
            <main className="workspace">
                {activeTab === 'script' && (
                    <ScriptPane script={script} setScript={setScript} onSplit={handleExtractRoles} loading={loadingExtract} />
                )}
                {activeTab === 'characters' && (
                    <>
                        <CharacterPane characters={characters} onAdd={handleAddCharacter} onEdit={handleEditCharacter} banner={bannerInfo} onProceed={() => setProjectSetup(s => ({ ...s, open: true }))} proceedDisabled={characters.length === 0} loading={loadingSplit} />
                        <CharacterModal open={charModal.open} initial={charModal.initial} onClose={() => setCharModal({ open: false, initial: null })} onSave={handleSaveCharacter} showAlert={showAlert} />
                    </>
                )}
                {activeTab === 'storyboard' && (
                    <StoryboardPane
                        frames={frames}
                        updateFrame={updateFrame}
                        aiPopupState={aiPopupState}
                        setAiPopupState={setAiPopupState}
                        handleAIRequest={handleAIRequest}
                        characters={characters}
                        onGeneratePreview={handleGeneratePreview}
                        onUploadPreview={handleUploadPreview}
                        onGenerateAll={handleGenerateAllPreviews}
                        generating={generating}
                        generatingIds={generatingIds}
                        displayRatio={(bannerInfo.ratio || projectSetup.ratio || '1:1')}
                        stopping={stopping}
                        onStop={() => {
                            setStopping(true);
                            setCancelGeneration(true);
                            cancelRef.current = true;
                            try {
                                genAbortController?.abort();
                            } catch { }
                        }}
                        onRegenerate={async () => {
                            try {
                                // 清理与分镜相关的本地缓存
                                localStorage.removeItem(CACHE_KEYS.frames);
                                localStorage.removeItem('cache.storyboard.viewMode');
                                localStorage.removeItem('cache.storyboard.exportOpen');
                            } catch { }
                            try {
                                setLoadingSplit(true);
                                const roleNames = characters.map(c => ({ name: c.name, styleTags: c.styleTags }));
                                const useRatio = bannerInfo.ratio || projectSetup.ratio || '16:9';
                                const useStyle = bannerInfo.style || projectSetup.style || '写实';
                                const res = await splitStoryboard({ script, ratio: useRatio, style: useStyle, roles: roleNames });
                                let mapped = normalizeFrames(res?.frames);
                                const roleSet = new Set(characters.map(c => c.name));
                                mapped = mapped.map(f => {
                                    const names = String(f.character || '').split(',').map(n => n.trim()).filter(Boolean);
                                    const filtered = names.filter(n => roleSet.has(n));
                                    return { ...f, character: filtered.join(',') };
                                });
                                if (mapped.length === 0) throw new Error('未返回分镜');
                                setFrames(mapped);
                                setWorkflowStep('frames');
                                setActiveTab('storyboard');
                            } catch (e) {
                                showAlert(`重新生成失败：${e.message}`, '错误', 'error');
                            } finally {
                                setLoadingSplit(false);
                            }
                        }}
                    />
                )}
            </main>

            {globalLoadingMsg && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 50 50" aria-label="loading">
                            <circle cx="25" cy="25" r="20" stroke="var(--accent)" strokeWidth="5" fill="none" strokeDasharray="90" strokeDashoffset="0">
                                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{globalLoadingMsg}</span>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={modal.isOpen && modal.type === 'alert'}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.alertType}
            />

            <ConfirmModal
                isOpen={modal.isOpen && modal.type === 'confirm'}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                isDangerous={modal.isDangerous}
            />

        </div>
    );
}

export default App;

const CharacterModal = ({ open, onClose, onSave, initial, showAlert }) => {
    const [name, setName] = useState(initial?.name || '');
    const [age, setAge] = useState(initial?.age || '');
    const [gender, setGender] = useState(initial?.gender || '其他');
    const [nationality, setNationality] = useState(initial?.nationality || '中国');
    const [traits, setTraits] = useState(initial?.traits || '');
    const [backstory, setBackstory] = useState(initial?.backstory || '');
    const [styleTags, setStyleTags] = useState(initial?.styleTags?.join(',') || '');
    const [desc, setDesc] = useState(initial?.desc || '');
    const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
    const [referenceImages, setReferenceImages] = useState(initial?.referenceImages || []);
    const [generating, setGenerating] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    useEffect(() => {
        if (open) {
            setName(initial?.name || '');
            setAge(initial?.age || '');
            setGender(initial?.gender || '其他');
            setNationality(initial?.nationality || '中国');
            setTraits(initial?.traits || '');
            setBackstory(initial?.backstory || '');
            setStyleTags(initial?.styleTags?.join(',') || '');
            setDesc(initial?.desc || '');
            setImageUrl(initial?.imageUrl || '');
            setReferenceImages(initial?.referenceImages || []);
            setGenerating(false);
        }
    }, [open, initial]);

    if (!open) return null;

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        setReferenceImages([url]);
    };

    const handleGenerate = async () => {
        // 验证基本信息
        if (!name.trim()) {
            showAlert('请先填写角色名称', '提示', 'warning');
            return;
        }

        setGenerating(true);

        try {
            // 调用API生成图片
            const result = await generateCharacterImage({
                name: name.trim(),
                desc,
                age,
                gender,
                nationality,
                traits
            });

            if (result.success) {
                setImageUrl(result.imageUrl);
                setReferenceImages([result.imageUrl]);
            } else {
                showAlert(`生成失败: ${result.error || '未知错误'}`, '错误', 'error');
            }
        } catch (error) {
            showAlert(`生成失败: ${error.message}`, '错误', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = () => {
        const data = {
            id: initial?.id || Date.now().toString(),
            name: name.trim() || '未命名角色',
            age,
            gender,
            nationality,
            traits,
            backstory,
            styleTags: styleTags.split(',').map(s => s.trim()).filter(Boolean),
            desc,
            imageUrl: imageUrl || '',
            referenceImages,
            avatarColor: initial?.avatarColor || '#3b82f6'
        };
        onSave(data);
    };

    return (
        <div className="modal-overlay">
            <div className="glass-panel modal">
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>角色设定</h3>
                <div className="character-form-grid">
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>名称</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>年龄</label>
                        <input value={age} onChange={(e) => setAge(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>性别</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)}>
                            <option>男</option>
                            <option>女</option>
                            <option>其他</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>国籍</label>
                        <input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="例如：中国" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>人物特征</label>
                        <input value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="例如：冷酷，敏捷，黑色雨衣" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>设定摘要</label>
                        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="角色外观与性格简述" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>背景故事</label>
                        <textarea value={backstory} onChange={(e) => setBackstory(e.target.value)} placeholder="简要背景故事" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>风格标签</label>
                        <input value={styleTags} onChange={(e) => setStyleTags(e.target.value)} placeholder="例如：写实, 黑色电影" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                    <div className="image-preview" style={{ cursor: imageUrl ? 'zoom-in' : 'default' }} onClick={() => imageUrl && setLightboxUrl(imageUrl)}>
                        {imageUrl ? (
                            <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div className="flex-center" style={{ width: '100%', height: '100%', color: 'var(--text-secondary)' }}>
                                <ImageIcon size={24} />
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                            上传图片
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                        </label>
                        <button
                            className={`btn ${generating ? 'btn-disabled' : 'btn-primary'}`}
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            <Sparkles size={14} />
                            {generating ? '生成中...' : '生成预览图'}
                        </button>
                    </div>
                </div>

                {lightboxUrl && (
                    <div className="modal-overlay" style={{ zIndex: 1101 }} onClick={() => setLightboxUrl(null)}>
                        <div style={{ background: 'transparent' }} onClick={(e) => e.stopPropagation()}>
                            <img src={lightboxUrl} alt="preview" className="image-lightbox-img" />
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button className="btn btn-ghost" onClick={onClose}><X size={14} />取消</button>
                    <button className="btn btn-primary" onClick={handleSave}><Check size={14} />确认</button>
                </div>
            </div>
        </div>
    );
};
