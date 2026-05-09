export const getFullUrl = (path: string | null) => {
    if (!path) return null;
    
    // Si la ruta ya es absoluta pero apunta a localhost, la limpiamos para usar la de producción
    let cleanPath = path;
    if (path.startsWith('http://localhost:5000')) {
        cleanPath = path.replace('http://localhost:5000', '');
    } else if (path.startsWith('http')) {
        return path;
    }
    
    const backendUrl = import.meta.env.VITE_API_URL || 'https://squadfinder-api.onrender.com';
    // Asegurarse de que no haya doble barra ni falte la barra
    const cleanBase = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    
    return `${cleanBase}${finalPath}`;
};

export const getGameImageUrl = (url: string | null) => {
    return getFullUrl(url);
};

export const resolveAvatarUrl = (url?: string, username?: string) => {
    if (!url) {
        if (!username) return undefined;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6d28d9&color=fff&size=200`;
    }
    // Si es una ruta de nuestro backend (relativa o de localhost), usamos getFullUrl para normalizarla
    if (url.startsWith('/static') || url.includes('localhost:5000')) {
        return getFullUrl(url);
    }
    return url;
};
