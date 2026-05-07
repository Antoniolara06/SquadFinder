export const getGameImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'https://squadfinder-api.onrender.com';
    return `${backendUrl}${url}`;
};
