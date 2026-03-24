import React, { useState, useEffect, useRef } from 'react';
import type { Game } from '../types';
import './GameSearchSelect.css';

interface Props {
  games: Game[];
  value: string;           // game_id seleccionado
  onChange: (gameId: string, game: Game | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const GameSearchSelect: React.FC<Props> = ({
  games,
  value,
  onChange,
  disabled = false,
  placeholder = 'Busca un juego...'
}) => {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  // Juego actualmente seleccionado
  const selectedGame = games.find(g => String(g.id) === value) ?? null;

  // Filtrar juegos localmente (sin peticiones)
  const filtered = query.trim().length === 0
    ? games
    : games.filter(g =>
        g.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (g.genero ?? '').toLowerCase().includes(query.toLowerCase())
      );

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (game: Game) => {
    onChange(String(game.id), game);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('', null);
    setQuery('');
  };

  return (
    <div className={`gss-wrap ${disabled ? 'gss-disabled' : ''}`} ref={containerRef}>

      {/* ── Juego seleccionado ── */}
      {selectedGame ? (
        <div className="gss-selected" onClick={() => !disabled && setOpen(o => !o)}>
          {selectedGame.foto_portada && (
            <img src={selectedGame.foto_portada} alt={selectedGame.nombre} className="gss-sel-cover" />
          )}
          <div className="gss-sel-info">
            <span className="gss-sel-name">{selectedGame.nombre}</span>
            {selectedGame.genero && <span className="gss-sel-genre">{selectedGame.genero}</span>}
          </div>
          {!disabled && (
            <button
              type="button"
              className="gss-clear"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              title="Cambiar juego"
            >✕</button>
          )}
        </div>
      ) : (
        /* ── Input de búsqueda ── */
        <div className="gss-input-wrap" onClick={() => !disabled && setOpen(true)}>
          <span className="gss-icon">🎮</span>
          <input
            type="text"
            className="gss-input"
            placeholder={disabled ? 'Inicia sesión para publicar' : placeholder}
            value={query}
            disabled={disabled}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => !disabled && setOpen(true)}
          />
          {query && (
            <button type="button" className="gss-clear" onClick={() => setQuery('')}>✕</button>
          )}
        </div>
      )}

      {/* ── Dropdown ── */}
      {open && !disabled && (
        <div className="gss-dropdown">
          {/* Conteo */}
          <div className="gss-count">
            {filtered.length} juego{filtered.length !== 1 ? 's' : ''}
            {query && ` para "${query}"`}
          </div>

          <ul className="gss-list">
            {filtered.length > 0 ? (
              filtered.map(game => (
                <li
                  key={game.id}
                  className={`gss-item ${String(game.id) === value ? 'gss-item--active' : ''}`}
                  onMouseDown={() => handleSelect(game)}
                >
                  <div className="gss-item-cover">
                    {game.foto_portada
                      ? <img src={game.foto_portada} alt={game.nombre} />
                      : <span>🎮</span>
                    }
                  </div>
                  <div className="gss-item-info">
                    <span className="gss-item-name">{game.nombre}</span>
                    {game.genero && <span className="gss-item-genre">{game.genero}</span>}
                  </div>
                  {String(game.id) === value && <span className="gss-check">✓</span>}
                </li>
              ))
            ) : (
              <li className="gss-empty">No se encontró ningún juego</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameSearchSelect;
