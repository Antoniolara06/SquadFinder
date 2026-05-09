export const getFullUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Asegurarse de que no haya doble barra ni falte la barra
    const cleanBase = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBase}${cleanPath}`;
};

export const getGameImageUrl = (url: string | null) => {
    return getFullUrl(url);
};

export const resolveAvatarUrl = (url?: string, username?: string) => {
    if (!url) {
        if (!username) return undefined;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6d28d9&color=fff&size=200`;
    }
    return url.startsWith('/static') ? getFullUrl(url) : url;
};
