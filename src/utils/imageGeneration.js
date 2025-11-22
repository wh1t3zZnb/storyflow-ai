import { loadApiConfig } from './apiConfig.js'

/**
 * 为角色生成参考图
 * @param {Object} character - 角色数据
 * @param {string} character.name - 角色名称
 * @param {string} character.desc - 角色描述
 * @param {string} character.age - 角色年龄
 * @param {string} character.gender - 角色性别
 * @param {string} character.traits - 角色特征
 * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
 */
export async function generateCharacterImage(character) {
    try {
        const { imageBaseUrl, imageApiKey, imageModelId, baseUrl, apiKey, modelId } = loadApiConfig();
        const API_URL = (imageBaseUrl || baseUrl || 'https://openrouter.ai/api/v1/chat/completions');
        const MODEL = (imageModelId || modelId || 'google/gemini-2.5-flash-image');
        // 构建提示词
        const prompt = buildCharacterPrompt(character);

        // 调用API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${imageApiKey || apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: "你是专业的角色设计师,擅长创作一致的角色形象。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();

        // 提取图片URL (Base64格式)
        const images = data.choices?.[0]?.message?.images;
        if (!images || images.length === 0) {
            throw new Error('API未返回图片数据');
        }

        const imageUrl = images[0].image_url.url;

        return {
            success: true,
            imageUrl: imageUrl  // data:image/png;base64,... 格式
        };

    } catch (error) {
        console.error('生成角色图片失败:', error);
        return {
            success: false,
            error: error.message || '图片生成失败'
        };
    }
}

/**
 * 构建角色图片生成提示词
 * @param {Object} character - 角色数据
 * @returns {string} 提示词
 */
const STYLE_PRESETS = {
    '通用': {
        name: '写实摄影',
        lines: [
            '写实摄影',
            '胶片级色彩分级',
            '35mm 定焦, f/2.8',
            '柔和自然光, 低对比度',
            '微颗粒质感, 电影感'
        ],
        negative: [
            '卡通', '漫画', '水彩', '赛璐璐', '插画风', '3D 渲染', '过度锐化', '夸张风格'
        ]
    },
    '写实摄影': {
        name: '写实摄影',
        lines: [
            '写实摄影',
            '电影级色彩分级',
            '35mm 定焦, f/2.8',
            '自然光照, 柔和阴影',
            '低噪点, 真实质感'
        ],
        negative: [
            '卡通', '漫画', '水彩', '插画风', '3D 渲染', '夸张风格'
        ]
    }
};

function buildStyleBlock(style) {
    const preset = STYLE_PRESETS[style] || STYLE_PRESETS['写实摄影'];
    const lines = [];
    lines.push('【整体风格】');
    preset.lines.forEach(l => lines.push(`- ${l}`));
    lines.push('【避免】');
    lines.push(`- ${preset.negative.join('，')}`);
    return lines.join('\n');
}

function buildCharacterPrompt(character) {
    const parts = [];

    // 基础信息
    let basicInfo = character.name || '角色';

    // 添加性别和年龄
    const details = [];
    if (character.nationality) {
        details.push(character.nationality);
    }
    if (character.gender && character.gender !== '其他') {
        details.push(character.gender);
    }
    if (character.age) {
        // 如果age已经包含"岁"或"左右"等文字,直接使用
        const ageStr = String(character.age);
        if (ageStr.includes('岁') || ageStr.includes('左右') || ageStr.includes('中年') || ageStr.includes('青年') || ageStr.includes('老年')) {
            details.push(ageStr);
        } else {
            details.push(`${ageStr}岁`);
        }
    }

    if (details.length > 0) {
        basicInfo += `, ${details.join(', ')}`;
    }

    parts.push(`生成角色参考图: ${basicInfo}`);
    parts.push('');

    // **重点: 只使用desc字段作为外观描述**
    // desc字段应该包含发型、着装、体型等可视化特征
    if (character.desc && character.desc.trim()) {
        // 过滤掉可能混入的性格、背景等非视觉描述
        const descText = character.desc.trim();
        // 检查是否包含明显的非视觉词汇
        const hasNonVisual = /性格|背景|经历|故事|心理|情感|独居|工作|职业/.test(descText);

        if (!hasNonVisual) {
            // desc是纯外观描述,直接使用
            parts.push('【外观特征】');
            parts.push(descText);
            parts.push('');
        } else {
            // desc混入了非视觉信息,尝试提取外观部分
            // 通常外观描述在前半部分
            const sentences = descText.split(/[,，。]/);
            const visualSentences = sentences.filter(s => {
                return s && !/性格|背景|经历|故事|心理|情感|独居|工作|职业/.test(s);
            });

            if (visualSentences.length > 0) {
                parts.push('【外观特征】');
                parts.push(visualSentences.join('，'));
                parts.push('');
            }
        }
    }

    // traits字段通常是性格特征,不应该用于图片生成
    // 但如果desc为空,可以作为补充参考
    if ((!character.desc || character.desc.trim() === '') && character.traits) {
        parts.push('【参考特征】');
        parts.push(character.traits);
        parts.push('');
    }

    // 固定要求
    parts.push(buildStyleBlock('写实摄影'));
    parts.push('【生成要求】');
    parts.push('- 角度: 正面或3/4侧面肖像');
    parts.push('- 重点: 清晰的面部特征和整体形象');
    parts.push('- 背景: 简洁纯色或虚化背景');
    parts.push('- 只生成一个人物肖像');

    return parts.join('\n');
}

/**
 * 为分镜生成预览图
 * @param {Object} frame - 分镜数据
 * @param {Array} characters - 角色列表
 * @param {string} globalStyle - 全局风格
 * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
 */
export async function generateStoryboardImage(frame, characters = [], globalStyle = '写实摄影', ratio = '1:1', signal) {
    try {
        const { imageBaseUrl, imageApiKey, imageModelId, baseUrl, apiKey, modelId } = loadApiConfig();
        const API_URL = (imageBaseUrl || baseUrl || 'https://openrouter.ai/api/v1/chat/completions');
        const MODEL = (imageModelId || modelId || 'google/gemini-2.5-flash-image');
        // 构建提示词
        const prompt = buildStoryboardPrompt(frame, globalStyle, characters);

        // 获取相关角色的参考图
        const characterImages = getCharacterReferences(frame, characters);

        // 构建消息内容
        const content = [];
        if (frame.character && characters && characters.length > 0) {
            const names = frame.character.split(',').map(n => n.trim()).filter(Boolean);
            const metas = names.map(n => {
                const c = characters.find(x => x.name === n);
                return c && c.nationality ? `${n}(${c.nationality})` : n;
            }).filter(Boolean);
            if (metas.length > 0) {
                content.push({ type: "text", text: `角色信息: ${metas.join(', ')}` });
            }
        }
        content.push({ type: "text", text: prompt });

        // 添加角色参考图
        if (characterImages.length > 0) {
            characterImages.forEach(img => {
                content.push({
                    type: "image_url",
                    image_url: { url: img }
                });
            });
        }

        // 调用API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${imageApiKey || apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                modalities: ["text", "image"],
                image_config: { aspect_ratio: ratio },
                messages: [
                    {
                        role: "system",
                        content: `你是专业的分镜画师。必须严格遵循给定的整体风格与角色外观。在不同镜头里保持同一角色的形象一致，不改变风格、材质、光照与色彩分级。`
                    },
                    {
                        role: "user",
                        content: content
                    }
                ]
            }),
            signal
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();

        // 提取图片
        const images = data.choices?.[0]?.message?.images;
        if (!images || images.length === 0) {
            throw new Error('API未返回图片数据');
        }

        const imageUrl = images[0].image_url.url;

        return {
            success: true,
            imageUrl: imageUrl
        };

    } catch (error) {
        console.error('生成分镜图片失败:', error);
        return {
            success: false,
            error: error.message || '图片生成失败'
        };
    }
}

/**
 * 构建分镜图片生成提示词
 * @param {Object} frame - 分镜数据
 * @param {string} globalStyle - 全局风格
 * @returns {string} 提示词
 */
function buildStoryboardPrompt(frame, globalStyle, characters = []) {
    const parts = [];

    parts.push('你是专业的分镜画师。请生成分镜图片。');
    parts.push('');

    parts.push(buildStyleBlock(globalStyle));
    parts.push('');

    // 场景信息
    parts.push(`【场景 ${frame.scene}】`);
    if (frame.character) {
        parts.push(`角色: ${frame.character}`);
        const names = String(frame.character).split(',').map(n => n.trim()).filter(Boolean);
        const descs = names.map(n => {
            const c = characters.find(x => x.name === n);
            if (!c) return null;
            const basics = [c.nationality, (c.gender && c.gender !== '其他') ? c.gender : null, c.age].filter(Boolean).join(', ');
            const d = c.desc ? c.desc : '';
            return `${n}${basics ? `（${basics}）` : ''}: ${d}`.trim();
        }).filter(Boolean);
        if (descs.length > 0) {
            parts.push('【角色外观】');
            descs.forEach(line => parts.push(`- ${line}`));
        }
    }
    if (frame.shot) {
        parts.push(`景别: ${frame.shot}`);
    }
    parts.push('');

    // 画面描述
    parts.push(frame.content || '');
    parts.push('');
    parts.push('【镜头设定】');
    parts.push('- 统一镜头参数与色调, 不改变风格');
    parts.push('- 构图稳定, 光照一致, 色彩分级一致');
    parts.push('');
    
    return parts.join('\n');
}

/**
 * 获取相关角色的参考图
 * @param {Object} frame - 分镜数据
 * @param {Array} characters - 角色列表
 * @returns {Array<string>} 角色参考图URL数组
 */
function getCharacterReferences(frame, characters) {
    if (!frame.character || !characters || characters.length === 0) {
        return [];
    }

    // 分镜中的角色名可能是逗号分隔的
    const characterNames = frame.character.split(',').map(n => n.trim());

    // 查找匹配的角色并返回参考图
    const refs = [];
    characterNames.forEach(name => {
        const char = characters.find(c => c.name === name);
        if (char && char.imageUrl) {
            refs.push(char.imageUrl);
        }
        if (char && Array.isArray(char.referenceImages)) {
            char.referenceImages.forEach(url => { if (url) refs.push(url); });
        }
    });

    return refs;
}
