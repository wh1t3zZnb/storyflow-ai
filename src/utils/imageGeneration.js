import { loadApiConfig } from './apiConfig.js'
import { createMockImage } from './mockImage.js'

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
            const msg = httpErrorMessage(response.status);
            throw new Error(msg);
        }

        const data = await response.json();
        const imageUrl = extractImageUrl(data);
        if (!imageUrl) {
            throw new Error('API未返回图片数据');
        }

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
export async function generateStoryboardImage(frame, characters = [], globalStyle = '写实摄影', ratio = '1:1', signal, sceneAnchor = '', sceneRefs = []) {
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
        if (sceneAnchor && typeof sceneAnchor === 'string' && sceneAnchor.trim()) {
            content.push({ type: "text", text: `环境锚点: ${sceneAnchor.trim()}` });
        }

        // 添加角色参考图
        if (characterImages.length > 0) {
            characterImages.forEach(img => {
                content.push({
                    type: "image_url",
                    image_url: { url: img }
                });
            });
        }
        if (Array.isArray(sceneRefs) && sceneRefs.length > 0) {
            sceneRefs.forEach(img => {
                if (img) {
                    content.push({ type: "image_url", image_url: { url: img } });
                }
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
                        content: `
                        你是专业的分镜画师。目标：同一场景内的所有镜头环境（包含连续、穿插、回到、并行视角）保持一致，仅镜头参数与人物姿态可变。
                        有参考图：严格对齐参考图的空间布局、主要物件、材质纹理、灯光类型与方向与色温、色彩分级、曝光与白平衡。
                        无参考图：从分镜文字中提取环境锚点（地点、空间结构、主要物件、装饰、材质纹理、灯光、时间/天气、标识文字），在后续镜头中复用同一组锚点，位置与特征保持不变。
                        一致性范围：
                        1）空间结构与布局：墙/窗/门/吧台/货架等相对位置与尺度不变；
                        2）场景物品与装饰：数量、位置、朝向、尺寸、状态（开/合、满/空）不变，除非分镜文字明确说明变化；
                        3）标识与文字元素：招牌/海报/标签的内容、字体、颜色与位置不变；
                        4）材质与纹理细节：地面/墙面/家具的材质、纹理、磨损/污渍/反射特征不变；
                        5）光照与阴影：灯光类型与方向、色温与强度、阴影硬度与反射/高光不变；
                        6）色彩分级与氛围：整体色彩分级、白平衡、对比度与颗粒/噪点风格不变；
                        7）时间与天气：未在文字中说明变化视为不变；不得切换地点。
                        允许变化：景别、机位、运镜、构图、人物姿态与站位。
                        词汇一致：对环境锚点使用同一组词，不引入同义词或新名词。
                        冲突处理：以环境一致性为最高优先。
                        `
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
            const msg = httpErrorMessage(response.status);
            throw new Error(msg);
        }

        let data = await response.json();
        let imageUrl = extractImageUrl(data);
        if (!imageUrl) {
            const retryBody = {
                model: MODEL,
                modalities: ["text", "image"],
                image_config: { aspect_ratio: ratio },
                messages: [
                    { role: "system", content: "只输出图片，禁止返回任何文字或JSON；如果返回富文本，请使用 output_image 或 image_url 类型。" },
                    { role: "user", content: content }
                ]
            };
            const retryResp = await fetch(API_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${imageApiKey || apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(retryBody), signal });
            if (retryResp.ok) {
                data = await retryResp.json();
                imageUrl = extractImageUrl(data);
            }
        }
        if (!imageUrl) {
            console.warn('未解析到图片，使用占位图');
            imageUrl = createMockImage(`场景 ${frame.scene}`);
        }

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

function extractImageUrl(data) {
    try {
        const msg = data?.choices?.[0]?.message;
        let url = null;
        const imgs = msg?.images;
        if (Array.isArray(imgs) && imgs.length > 0) {
            url = imgs[0]?.image_url?.url || imgs[0]?.url || null;
        }
        if (!url) {
            const content = msg?.content;
            if (Array.isArray(content)) {
                for (const c of content) {
                    if (c?.type === 'output_image' && c?.image_url?.url) { url = c.image_url.url; break; }
                    if (c?.type === 'image_url' && c?.image_url?.url) { url = c.image_url.url; break; }
                    if (c?.type === 'image' && c?.url) { url = c.url; break; }
                    if (c?.data_url && typeof c.data_url === 'string') { url = c.data_url; break; }
                    if (c?.image_base64 && typeof c.image_base64 === 'string') { url = `data:image/png;base64,${c.image_base64}`; break; }
                    if (c?.type === 'text' && typeof c.text === 'string') {
                        const m = c.text.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
                        if (m && m[0]) { url = m[0]; break; }
                        const http = c.text.match(/https?:\/\/\S+/);
                        if (http && http[0]) { url = http[0]; break; }
                        const md = c.text.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
                        if (md && md[1]) { url = md[1]; break; }
                    }
                }
            } else if (typeof content === 'string') {
                const m = content.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
                if (m && m[0]) url = m[0];
                if (!url) {
                    const http = content.match(/https?:\/\/\S+/);
                    if (http && http[0]) url = http[0];
                    if (!url) {
                        const md = content.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
                        if (md && md[1]) url = md[1];
                    }
                }
            }
        }
        return url || null;
    } catch {
        return null;
    }
}

function httpErrorMessage(status) {
    const s = Number(status);
    if (s === 401) return 'API密钥无效或未提供，请在设置中填写有效密钥';
    if (s === 402) return '账户余额不足或模型为付费，请充值或切换为可用的免费模型';
    if (s === 403) return '无权限访问该模型，请检查模型ID或权限范围';
    if (s === 429) return '请求频率受限，请稍后再试或降低并发';
    if (s >= 500) return `服务端错误(${s})，请稍后重试`;
    return `API请求失败: ${s}`;
}
