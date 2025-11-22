export const loadApiConfig = () => {
  try {
    const baseUrl = localStorage.getItem('api.baseUrl') || '';
    const modelId = localStorage.getItem('api.modelId') || '';
    const apiKey = localStorage.getItem('api.key') || '';
    const imageBaseUrl = localStorage.getItem('api.image.baseUrl') || '';
    const imageModelId = localStorage.getItem('api.image.modelId') || '';
    const imageApiKey = localStorage.getItem('api.image.key') || '';
    return {
      // 文本默认
      baseUrl,
      modelId,
      apiKey,
      // 图片专用（可选）
      imageBaseUrl,
      imageModelId,
      imageApiKey,
    };
  } catch {
    return { baseUrl: '', modelId: '', apiKey: '', imageBaseUrl: '', imageModelId: '', imageApiKey: '' };
  }
};

export const saveApiConfig = ({ baseUrl, modelId, apiKey, imageBaseUrl, imageModelId, imageApiKey }) => {
  if (baseUrl !== undefined) localStorage.setItem('api.baseUrl', baseUrl || '');
  if (modelId !== undefined) localStorage.setItem('api.modelId', modelId || '');
  if (apiKey !== undefined) localStorage.setItem('api.key', apiKey || '');
  if (imageBaseUrl !== undefined) localStorage.setItem('api.image.baseUrl', imageBaseUrl || '');
  if (imageModelId !== undefined) localStorage.setItem('api.image.modelId', imageModelId || '');
  if (imageApiKey !== undefined) localStorage.setItem('api.image.key', imageApiKey || '');
};