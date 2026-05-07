from flask import request, jsonify
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import app, db, Usuario, Juego, Rango, Anuncio, Friendship, Message, Sugerencia
import requests
import os
import time
from dotenv import load_dotenv
load_dotenv()
class CookiePolicyMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            new_headers = []
            for name, value in headers:
                if name.lower() == 'set-cookie' and 'session=' in value:
                    if 'SameSite=None' not in value:
                        value += '; SameSite=None'
                    if 'Secure' not in value:
                        value += '; Secure'
                new_headers.append((name, value))
            new_headers.append(('X-Squadfinder-Version', '2.0'))
            return start_response(status, new_headers, exc_info)
        return self.app(environ, custom_start_response)

app.wsgi_app = CookiePolicyMiddleware(app.wsgi_app)

# Configuración de CORS - permite cualquier subdominio de vercel.app + localhost
CORS(app, supports_credentials=True, origins=[
    r"http://localhost:.*",
    r"https://.*\.vercel\.app",
], allow_headers=["Content-Type"], methods=["GET","POST","PUT","DELETE","OPTIONS"])

# Configuración de LoginManager
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

# Función para cargar datos iniciales
def cargar_datos_iniciales():
    if not Juego.query.first():
        JUEGOS_Y_RANGOS = [
            {
                'juego': Juego(nombre='League of Legends', slug='league-of-legends', genero='MOBA',
                    foto_portada='/static/covers/league-of-legends.jpg'),
                'rangos': ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Esmeralda', 'Diamante', 'Master', 'Gran Master', 'Campeón']
            },
            {
                'juego': Juego(nombre='Valorant', slug='valorant', genero='Shooter',
                    foto_portada='/static/covers/valorant.jpg'),
                'rangos': ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Ascendente', 'Inmortal', 'Radiante']
            },
            {
                'juego': Juego(nombre='Counter-Strike 2', slug='cs2', genero='Shooter',
                    foto_portada='/static/covers/cs2.jpg'),
                'rangos': ['Plata I', 'Plata II', 'Plata III', 'Plata IV', 'Plata Élite', 'Plata Élite Master',
                           'Nova I', 'Nova II', 'Nova III', 'Nova Master',
                           'MG1', 'MG2', 'MGE', 'DMG', 'Águila Legendaria', 'Águila Suprema', 'Águila Suprema Master', 'Global Élite']
            },
            {
                'juego': Juego(nombre='Rocket League', slug='rocket-league', genero='Sports',
                    foto_portada='/static/covers/rocket-league.jpg'),
                'rangos': ['Bronce I', 'Bronce II', 'Bronce III',
                           'Plata I', 'Plata II', 'Plata III',
                           'Oro I', 'Oro II', 'Oro III',
                           'Platino I', 'Platino II', 'Platino III',
                           'Diamante I', 'Diamante II', 'Diamante III',
                           'Campeón I', 'Campeón II', 'Campeón III',
                           'Gran Campeón I', 'Gran Campeón II', 'Gran Campeón III',
                           'Supersónico Legendario']
            },
            {
                'juego': Juego(nombre='Fortnite', slug='fortnite', genero='Battle Royale',
                    foto_portada='/static/covers/fortnite.jpg'),
                'rangos': ['Bronce I', 'Bronce II', 'Bronce III',
                           'Plata I', 'Plata II', 'Plata III',
                           'Oro I', 'Oro II', 'Oro III',
                           'Platino I', 'Platino II', 'Platino III',
                           'Diamante I', 'Diamante II', 'Diamante III',
                           'Élite', 'Campeón', 'Invicto']
            },
            {
                'juego': Juego(nombre='Rainbow Six Siege', slug='r6-siege', genero='Shooter',
                    foto_portada='/static/covers/r6-siege.jpg'),
                'rangos': ['Cobre V', 'Cobre IV', 'Cobre III', 'Cobre II', 'Cobre I',
                           'Bronce V', 'Bronce IV', 'Bronce III', 'Bronce II', 'Bronce I',
                           'Plata V', 'Plata IV', 'Plata III', 'Plata II', 'Plata I',
                           'Oro V', 'Oro IV', 'Oro III', 'Oro II', 'Oro I',
                           'Platino V', 'Platino IV', 'Platino III', 'Platino II', 'Platino I',
                           'Diamante', 'Campeón']
            },
            {
                'juego': Juego(nombre='Overwatch 2', slug='overwatch-2', genero='Shooter',
                    foto_portada='/static/covers/overwatch-2.jpg'),
                'rangos': ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Master', 'Gran Master', 'TOP 500']
            },
            {
                'juego': Juego(nombre='Marvel Rivals', slug='marvel-rivals', genero='Shooter',
                    foto_portada='/static/covers/marvel-rivals.jpg'),
                'rangos': ['Bronce III', 'Bronce II', 'Bronce I',
                           'Plata III', 'Plata II', 'Plata I',
                           'Oro III', 'Oro II', 'Oro I',
                           'Platino III', 'Platino II', 'Platino I',
                           'Diamante III', 'Diamante II', 'Diamante I',
                           'Gran Master III', 'Gran Master II', 'Gran Master I',
                           'Celestial III', 'Celestial II', 'Celestial I',
                           'Eterno', 'Un Pundonor']
            },
        ]

        for entry in JUEGOS_Y_RANGOS:
            juego = entry['juego']
            db.session.add(juego)
            db.session.flush()  # genera el ID del juego
            for i, nombre_rango in enumerate(entry['rangos']):
                db.session.add(Rango(juego_id=juego.id, nombre=nombre_rango, orden=i))
        db.session.commit()
        print("✅ Juegos y rangos iniciales cargados.")

    if not Usuario.query.first():
        pass

# --- Rutas de Autenticación ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = Usuario.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify(user.to_dict()), 200
    
    return jsonify({'error': 'Credenciales inválidas'}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    
    
    if Usuario.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'El email ya está registrado'}), 400
        
    hashed_password = generate_password_hash(data.get('password'), method='pbkdf2:sha256')
    
    import json
    # Convertir lista de idiomas a JSON string
    idiomas_val = data.get('idiomas', [])
    if isinstance(idiomas_val, list):
        idiomas_json = json.dumps(idiomas_val)
    else:
        idiomas_json = json.dumps([])

    new_user = Usuario(
        username=data.get('username'),
        email=data.get('email'),
        password=hashed_password,
        pais=data.get('pais'),
        idiomas=idiomas_json,
        # Si fecha_nacimiento viene vacía, guardar None
        fecha_nacimiento=data.get('fecha_nacimiento') if data.get('fecha_nacimiento') else None
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Usuario creado, pero NO logueado automáticamente
    return jsonify({'message': 'Usuario registrado correctamente'}), 201

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Sesión cerrada'}), 200



# Configuración de uploads
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/me', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify(current_user.to_dict()), 200
    return jsonify({'error': 'No autenticado'}), 401

@app.route('/me/update', methods=['PUT'])
@login_required
def update_profile():
    # Detectar si es multipart/form-data o JSON
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form
        file = request.files.get('avatar_file')
    else:
        data = request.json
        file = None

    user = current_user
    
    try:
        if 'descripcion' in data:
            user.descripcion = data['descripcion']
        # Si envían URL directa (caso antiguo o externo)
        if 'avatar_url' in data and data['avatar_url']:
            user.avatar_url = data['avatar_url']
            
        if 'pais' in data:
            user.pais = data['pais']
        if 'idiomas' in data:
            import json
            idiomas_data = data['idiomas']
            # Si viene como string JSON (FormData), intentamos parsearlo primero
            if isinstance(idiomas_data, str):
                try:
                    parsed = json.loads(idiomas_data)
                    user.idiomas = idiomas_data if isinstance(parsed, list) else json.dumps([idiomas_data])
                except:
                    user.idiomas = json.dumps([idiomas_data])
            elif isinstance(idiomas_data, list):
                 user.idiomas = json.dumps(idiomas_data)

        if 'juegos' in data:
            import json
            juegos_data = data['juegos']
            if isinstance(juegos_data, str):
                try:
                    parsed = json.loads(juegos_data)
                    user.juegos = juegos_data if isinstance(parsed, list) else json.dumps([juegos_data])
                except:
                    user.juegos = json.dumps([juegos_data])
            elif isinstance(juegos_data, list):
                 user.juegos = json.dumps(juegos_data)

        if 'plataformas' in data:
            import json
            platform_data = data['plataformas']
            if isinstance(platform_data, str):
                try:
                    parsed = json.loads(platform_data)
                    user.plataformas = platform_data if isinstance(parsed, list) else json.dumps([platform_data])
                except:
                    user.plataformas = json.dumps([platform_data])
            elif isinstance(platform_data, list):
                 user.plataformas = json.dumps(platform_data)

        if 'horario_juego' in data:
            import json
            horario_data = data['horario_juego']
            if isinstance(horario_data, str):
                try:
                    parsed = json.loads(horario_data)
                    user.horario_juego = horario_data if isinstance(parsed, list) else json.dumps([horario_data])
                except:
                    user.horario_juego = json.dumps([horario_data])
            elif isinstance(horario_data, list):
                user.horario_juego = json.dumps(horario_data)
        if 'disponibilidad' in data:
            user.disponibilidad = data['disponibilidad']
        if 'fecha_nacimiento' in data and data['fecha_nacimiento']:
            user.fecha_nacimiento = data['fecha_nacimiento']
        if 'usa_microfono' in data:
            val = data['usa_microfono']
            user.usa_microfono = val in (True, 'true', 'True', '1', 1)

        # Manejo de archivo de imagen
        if file and allowed_file(file.filename):
            filename = secure_filename(f"user_{user.id}_{file.filename}")
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            # Guardamos la URL completa para que el frontend no tenga problemas
            # Usamos request.host_url para que funcione dinámicamente en Render
            user.avatar_url = f"{request.host_url}static/uploads/{filename}"

        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# --- Rutas de API ---

@app.route('/games', methods=['GET'])
def get_games():
    games = Juego.query.all()
    return jsonify([g.to_dict() for g in games]), 200

@app.route('/games/<int:game_id>/rangos', methods=['GET'])
def get_rangos(game_id):
    """Devuelve los rangos de un juego ordenados de menor a mayor."""
    rangos = Rango.query.filter_by(juego_id=game_id).order_by(Rango.orden.asc()).all()
    return jsonify([r.to_dict() for r in rangos]), 200

@app.route('/config', methods=['GET'])
def get_config():
    """Devuelve datos de configuración estáticos para los selects del frontend."""
    games = Juego.query.order_by(Juego.nombre.asc()).all()
    return jsonify({
        'juegos': [g.to_dict() for g in games],
        'plataformas': ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
        'idiomas': ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Ruso', 'Chino', 'Japonés', 'Coreano', 'Otro'],
        'paises': [
            'Alemania', 'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
            'Costa Rica', 'Ecuador', 'España', 'Francia', 'Italia', 'México',
            'Paraguay', 'Perú', 'Reino Unido', 'Uruguay', 'USA', 'Venezuela', 'Otro'
        ],
        'horarios': [
            f"{str(i * 2).zfill(2)}:00 - {str((i * 2 + 2) % 24).zfill(2)}:00"
            for i in range(12)
        ]
    }), 200

@app.route('/anuncios', methods=['GET'])
def get_anuncios():
    anuncios = Anuncio.query.all()
    # Para incluir datos relacionados, el to_dict de Anuncio ya lo maneja
    return jsonify([a.to_dict() for a in anuncios]), 200

@app.route('/players', methods=['GET'])
def get_players():
    # En un caso real, aceptaríamos parámetros de filtro aquí
    players = Usuario.query.all()
    return jsonify([p.to_dict() for p in players]), 200

@app.route('/anuncios', methods=['POST'])
@login_required
def create_anuncio():
    data = request.json
    
    try:
        new_anuncio = Anuncio(
            game_id=data.get('game_id'),
            user_id=current_user.id,
            title=data.get('title'),
            description=data.get('description'),
            required_rank=data.get('required_rank'),
            mic_required=data.get('mic_required', False),
            spots_available=data.get('spots_available', 1),
            hora_juego=data.get('hora_juego')
        )
        
        db.session.add(new_anuncio)
        db.session.commit()
        return jsonify(new_anuncio.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/anuncios/<int:anuncio_id>', methods=['DELETE'])
@login_required
def delete_anuncio(anuncio_id):
    anuncio = Anuncio.query.get(anuncio_id)
    if not anuncio:
        return jsonify({'error': 'Anuncio no encontrado'}), 404
    if anuncio.user_id != current_user.id:
        return jsonify({'error': 'No tienes permiso para eliminar este anuncio'}), 403
    db.session.delete(anuncio)
    db.session.commit()
    return jsonify({'message': 'Anuncio eliminado correctamente'}), 200

@app.route('/me/anuncios', methods=['GET'])
@login_required
def get_my_anuncios():
    """Devuelve los anuncios publicados por el usuario actual."""
    anuncios = Anuncio.query.filter_by(user_id=current_user.id).order_by(Anuncio.created_at.desc()).all()
    return jsonify([a.to_dict() for a in anuncios]), 200

# --- Rutas de Amigos ---

@app.route('/friends', methods=['GET'])
@login_required
def get_friends():
    # Amigos son aquellos con status='accepted' donde soy user o friend
    friends_1 = Friendship.query.filter_by(user_id=current_user.id, status='accepted').all()
    friends_2 = Friendship.query.filter_by(friend_id=current_user.id, status='accepted').all()
    
    # Construir lista de usuarios amigos
    friend_users = []
    seen_ids = set()
    
    for f in friends_1:
         if f.friend.id not in seen_ids:
            # Filtrar password
            data = f.friend.to_dict()
            if 'password' in data: del data['password']
            friend_users.append(data)
            seen_ids.add(f.friend.id)
            
    for f in friends_2:
         if f.user.id not in seen_ids:
            data = f.user.to_dict()
            if 'password' in data: del data['password']
            friend_users.append(data)
            seen_ids.add(f.user.id)
        
    # Solicitudes pendientes recibidas
    pending_received = Friendship.query.filter_by(friend_id=current_user.id, status='pending').all()
    
    # Solicitudes pendientes enviadas
    pending_sent = Friendship.query.filter_by(user_id=current_user.id, status='pending').all()

    return jsonify({
        'friends': friend_users,
        'received_requests': [r.to_dict() for r in pending_received],
        'sent_requests': [r.to_dict() for r in pending_sent]
    }), 200

@app.route('/friends/request', methods=['POST'])
@login_required
def send_friend_request():
    data = request.json
    friend_id = data.get('friend_id')
    
    if not friend_id:
        return jsonify({'error': 'Friend ID required'}), 400
    
    if friend_id == current_user.id:
        return jsonify({'error': 'Cannot add yourself as friend'}), 400
        
    # Check existing
    existing = Friendship.query.filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == current_user.id))
    ).first()
    
    if existing:
        if existing.status == 'accepted':
            return jsonify({'message': 'Already friends', 'status': 'accepted'}), 200
        if existing.status == 'pending':
            return jsonify({'message': 'Request already pending', 'status': 'pending'}), 200
        if existing.status == 'rejected':
             # Allow re-sending? Maybe delete old record
             db.session.delete(existing)
             # fall through to create new
            
    new_request = Friendship(user_id=current_user.id, friend_id=friend_id, status='pending')
    db.session.add(new_request)
    db.session.commit()
    
    return jsonify({'message': 'Friend request sent', 'status': 'pending'}), 201

@app.route('/friends/accept/<int:request_id>', methods=['POST'])
@login_required
def accept_friend_request(request_id):
    friendship = Friendship.query.get(request_id)
    if not friendship:
        return jsonify({'error': 'Request not found'}), 404
        
    if friendship.friend_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    friendship.status = 'accepted'
    db.session.commit()
    
    return jsonify({'message': 'Friend request accepted'}), 200

@app.route('/friends/reject/<int:request_id>', methods=['POST'])
@login_required
def reject_friend_request(request_id):
    friendship = Friendship.query.get(request_id)
    if not friendship:
        return jsonify({'error': 'Request not found'}), 404
        
    if friendship.friend_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    db.session.delete(friendship)
    db.session.commit()
    
    return jsonify({'message': 'Friend request rejected'}), 200

# --- Rutas de Chat ---

@app.route('/chat/conversations', methods=['GET'])
@login_required
def get_conversations():
    """Devuelve todos los usuarios con los que has intercambiado mensajes,
    con el último mensaje y si son amigos."""
    from sqlalchemy import or_, and_, func, case
    uid = current_user.id

    # Todos los mensajes donde participa el usuario
    msgs = Message.query.filter(
        or_(Message.sender_id == uid, Message.receiver_id == uid)
    ).order_by(Message.created_at.desc()).all()

    # Construir mapa de usuario_id -> último mensaje
    seen: dict = {}
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == uid else m.sender_id
        if other_id not in seen:
            seen[other_id] = m

    # IDs de amigos aceptados
    friend_ids = set()
    friendships = Friendship.query.filter(
        or_(Friendship.user_id == uid, Friendship.friend_id == uid),
        Friendship.status == 'accepted'
    ).all()
    for f in friendships:
        other = f.friend_id if f.user_id == uid else f.user_id
        friend_ids.add(other)

    result = []
    for other_id, last_msg in seen.items():
        other_user = Usuario.query.get(other_id)
        if not other_user:
            continue
        result.append({
            'user': other_user.to_dict(),
            'last_message': last_msg.to_dict(),
            'is_friend': other_id in friend_ids
        })

    # Ordenar por último mensaje más reciente
    result.sort(key=lambda x: x['last_message']['created_at'], reverse=True)
    return jsonify(result), 200


@app.route('/chat/<int:friend_id>', methods=['GET'])
@login_required
def get_messages(friend_id):
    """Devuelve el historial de mensajes entre el usuario actual y friend_id."""
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == friend_id)) |
        ((Message.sender_id == friend_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.created_at.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200

@app.route('/chat/<int:friend_id>', methods=['POST'])
@login_required
def send_message(friend_id):
    """Envía un mensaje al usuario friend_id. No requiere amistad."""
    data = request.json
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'El mensaje no puede estar vacío'}), 400
    if len(content) > 1000:
        return jsonify({'error': 'Mensaje demasiado largo'}), 400

    # Verificar que el receptor existe
    receiver = Usuario.query.get(friend_id)
    if not receiver:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    msg = Message(sender_id=current_user.id, receiver_id=friend_id, content=content)
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

@app.route('/sugerencias', methods=['POST'])
@login_required
def create_sugerencia():
    data = request.json
    contenido = data.get('contenido', '').strip()
    
    if not contenido:
        return jsonify({'error': 'El contenido no puede estar vacío'}), 400
        
    try:
        new_sugerencia = Sugerencia(
            user_id=current_user.id,
            user_nickname=current_user.username,
            contenido=contenido
        )
        db.session.add(new_sugerencia)
        db.session.commit()
        return jsonify(new_sugerencia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# ─── Arranque ─────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        cargar_datos_iniciales()
    app.run(debug=True, port=5000)

