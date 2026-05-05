export const getGameImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Prepend the backend URL for local static assets
    return `http://localhost:5000${url}`;
};
