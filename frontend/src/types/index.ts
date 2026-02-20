export interface User {
    id: number;
    username: string;
    email: string;
    fecha_nacimiento: string;
    descripcion?: string;
    avatar_url?: string;
    pais?: string;
    idiomas?: string[];
    juegos?: string[];
    plataformas?: string[];
    disponibilidad?: string;
    fecha_registro: string;
}

export interface Game {
    id: number;
    nombre: string;
    slug: string;
    genero?: string;
    foto_portada?: string;
}

export interface GameProfile {
    id: number;
    usuario_id: number;
    juego_id: number;
    nickname_juego: string;
    rango_actual: string;
    rol_preferido?: string;
    usuario_plataforma?: string;
}

// Representa un anuncio en el tablón (Busco partida / Busco jugadores)
export interface Anuncio {
    id: number;
    game_id: number;
    user_id: number;
    title: string;
    description: string;
    required_rank?: string;
    mic_required: boolean;
    spots_available: number;
    hora_juego?: string;
    created_at: string;

    // Relaciones completas
    game?: Game;
    user?: User;
}
