export const loadApiConfig = () => {
  try {
    const baseUrl = localStorage.getItem('api.baseUrl') || '';
    const modelId = localStorage.getItem('api.modelId') || '';
    const apiKey = localStorage.getItem('api.key') || '';
    return { baseUrl, modelId, apiKey };
  } catch {
    return { baseUrl: '', modelId: '', apiKey: '' };
  }
};

export const saveApiConfig = ({ baseUrl, modelId, apiKey }) => {
  localStorage.setItem('api.baseUrl', baseUrl || '');
  localStorage.setItem('api.modelId', modelId || '');
  localStorage.setItem('api.key', apiKey || '');
};