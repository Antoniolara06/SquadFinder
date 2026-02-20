/**
 * Rangos disponibles por juego (por slug o nombre).
 * Se usa en el formulario de creación de anuncios.
 */
export const RANGOS_POR_JUEGO: Record<string, string[]> = {
    // League of Legends
    'league-of-legends': ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda', 'Diamante', 'Master', 'Gran Master', 'Campeón'],
    'league of legends': ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda', 'Diamante', 'Master', 'Gran Master', 'Campeón'],
    // Valorant
    'valorant': ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Ascendente', 'Inmortal', 'Radiante'],
    // CS2
    'cs2': ['Plata I', 'Plata II', 'Plata III', 'Plata IV', 'Plata Élite', 'Plata Élite Master', 'Nova I', 'Nova II', 'Nova III', 'Nova Master', 'MG1', 'MG2', 'MGE', 'DMG', 'Águila', 'Águila Suprema', 'Águila Suprema Master', 'Global Élite'],
    'counter-strike-2': ['Plata I', 'Plata II', 'Plata III', 'Plata IV', 'Plata Élite', 'Plata Élite Master', 'Nova I', 'Nova II', 'Nova III', 'Nova Master', 'MG1', 'MG2', 'MGE', 'DMG', 'Águila', 'Águila Suprema', 'Águila Suprema Master', 'Global Élite'],
    // Fortnite
    'fortnite': ['Bronce I', 'Bronce II', 'Bronce III', 'Plata I', 'Plata II', 'Plata III', 'Oro I', 'Oro II', 'Oro III', 'Platino I', 'Platino II', 'Platino III', 'Diamante I', 'Diamante II', 'Diamante III', 'Élite', 'Campeón', 'Invicto'],
    // Rocket League
    'rocket-league': ['Bronce I', 'Bronce II', 'Bronce III', 'Plata I', 'Plata II', 'Plata III', 'Oro I', 'Oro II', 'Oro III', 'Platino I', 'Platino II', 'Platino III', 'Diamante I', 'Diamante II', 'Diamante III', 'Campeón I', 'Campeón II', 'Campeón III', 'Gran Campeón I', 'Gran Campeón II', 'Gran Campeón III', 'Supersónico Legendario'],
    'rocket league': ['Bronce I', 'Bronce II', 'Bronce III', 'Plata I', 'Plata II', 'Plata III', 'Oro I', 'Oro II', 'Oro III', 'Platino I', 'Platino II', 'Platino III', 'Diamante I', 'Diamante II', 'Diamante III', 'Campeón I', 'Campeón II', 'Campeón III', 'Gran Campeón I', 'Gran Campeón II', 'Gran Campeón III', 'Supersónico Legendario'],
    // Apex Legends
    'apex-legends': ['Bronce IV', 'Bronce III', 'Bronce II', 'Bronce I', 'Plata IV', 'Plata III', 'Plata II', 'Plata I', 'Oro IV', 'Oro III', 'Oro II', 'Oro I', 'Platino IV', 'Platino III', 'Platino II', 'Platino I', 'Diamante IV', 'Diamante III', 'Diamante II', 'Diamante I', 'Master', 'Predador'],
    'apex legends': ['Bronce IV', 'Bronce III', 'Bronce II', 'Bronce I', 'Plata IV', 'Plata III', 'Plata II', 'Plata I', 'Oro IV', 'Oro III', 'Oro II', 'Oro I', 'Platino IV', 'Platino III', 'Platino II', 'Platino I', 'Diamante IV', 'Diamante III', 'Diamante II', 'Diamante I', 'Master', 'Predador'],
    // Overwatch 2
    'overwatch-2': ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Master', 'Gran Master', 'TOP 500'],
    'overwatch 2': ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Master', 'Gran Master', 'TOP 500'],
    // Dota 2
    'dota-2': ['Heraldo', 'Guardián', 'Cruzado', 'Arconte', 'Leyenda', 'Anciano', 'Divino', 'Inmortal'],
    'dota 2': ['Heraldo', 'Guardián', 'Cruzado', 'Arconte', 'Leyenda', 'Anciano', 'Divino', 'Inmortal'],
    // Default / otros
    'default': ['Principiante', 'Amateur', 'Semi-Pro', 'Pro'],
};

/**
 * Obtiene los rangos para un juego dado su nombre o slug.
 * Si no hay rangos específicos, devuelve los rangos por defecto.
 */
export const getRangosParaJuego = (nombreOSlug: string): string[] => {
    const key = nombreOSlug.toLowerCase().trim();
    return RANGOS_POR_JUEGO[key] ?? RANGOS_POR_JUEGO['default'];
};
