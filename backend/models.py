from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Usar la variable de entorno DATABASE_URL, si no existe, usar la local por defecto
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:@localhost/SquadFinder')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'squadfinder')

db = SQLAlchemy(app)

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    fecha_nacimiento = db.Column(db.Date, nullable=True)
    descripcion = db.Column(db.Text)
    avatar_url = db.Column(db.String(255))
    pais = db.Column(db.String(50))
    idiomas = db.Column(db.Text) # JSON list or comma-separated
    juegos = db.Column(db.Text) # JSON list of game names or IDs
    plataformas = db.Column(db.Text) # JSON list of platforms
    disponibilidad = db.Column(db.String(255))
    usa_microfono = db.Column(db.Boolean, default=False)
    horario_juego = db.Column(db.Text)  # JSON list of time slots
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        idiomas_list = []
        if self.idiomas:
            try:
                parsed = json.loads(self.idiomas)
                idiomas_list = parsed if isinstance(parsed, list) else [self.idiomas]
            except:
                idiomas_list = [self.idiomas]
        
        juegos_list = []
        if self.juegos:
            try:
                parsed = json.loads(self.juegos)
                juegos_list = parsed if isinstance(parsed, list) else [self.juegos]
            except:
                juegos_list = [self.juegos]

        plataformas_list = []
        if self.plataformas:
            try:
                parsed = json.loads(self.plataformas)
                plataformas_list = parsed if isinstance(parsed, list) else [self.plataformas]
            except:
                plataformas_list = [self.plataformas]

        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'fecha_nacimiento': self.fecha_nacimiento.isoformat() if self.fecha_nacimiento else None,
            'descripcion': self.descripcion,
            'avatar_url': self.avatar_url,
            'pais': self.pais,
            'idiomas': idiomas_list,
            'juegos': juegos_list,
            'plataformas': plataformas_list,
            'disponibilidad': self.disponibilidad,
            'usa_microfono': self.usa_microfono or False,
            'horario_juego': self.horario_juego or '[]',
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None
        }

class Juego(db.Model):
    __tablename__ = 'juegos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), nullable=False)
    genero = db.Column(db.String(50))
    foto_portada = db.Column(db.String(255))

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'slug': self.slug,
            'genero': self.genero,
            'foto_portada': self.foto_portada
        }

class Rango(db.Model):
    __tablename__ = 'rangos'
    id = db.Column(db.Integer, primary_key=True)
    juego_id = db.Column(db.Integer, db.ForeignKey('juegos.id'), nullable=False)
    nombre = db.Column(db.String(80), nullable=False)
    orden = db.Column(db.Integer, default=0)  # 0 = peor, mayor = mejor

    juego = db.relationship('Juego', backref='rangos')

    def to_dict(self):
        return {
            'id': self.id,
            'juego_id': self.juego_id,
            'nombre': self.nombre,
            'orden': self.orden
        }

class Anuncio(db.Model):
    __tablename__ = 'anuncios'
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('juegos.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    required_rank = db.Column(db.String(50))
    mic_required = db.Column(db.Boolean, default=False)
    spots_available = db.Column(db.Integer, nullable=False)
    hora_juego = db.Column(db.String(50)) # "22:00" or "Afternoon"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    game = db.relationship('Juego', backref='anuncios')
    user = db.relationship('Usuario', backref='mis_anuncios')

    def to_dict(self):
        return {
            'id': self.id,
            'game_id': self.game_id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'required_rank': self.required_rank,
            'mic_required': self.mic_required,
            'spots_available': self.spots_available,
            'hora_juego': self.hora_juego,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'game': self.game.to_dict() if self.game else None,
            'user': self.user.to_dict() if self.user else None
        }

class Friendship(db.Model):
    __tablename__ = 'friendships'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Note: user is the sender, friend is the receiver
    user = db.relationship('Usuario', foreign_keys=[user_id], backref='sent_requests')
    friend = db.relationship('Usuario', foreign_keys=[friend_id], backref='received_requests')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'friend_id': self.friend_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'sender': { k: v for k, v in self.user.to_dict().items() if k != 'password' } if self.user else None,
            'receiver': { k: v for k, v in self.friend.to_dict().items() if k != 'password' } if self.friend else None
        }

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('Usuario', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('Usuario', foreign_keys=[receiver_id], backref='received_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'sender_username': self.sender.username if self.sender else None,
            'sender_avatar': self.sender.avatar_url if self.sender else None,
        }

class Sugerencia(db.Model):
    __tablename__ = 'sugerencias'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    user_nickname = db.Column(db.String(50), nullable=False)
    contenido = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('Usuario', backref='mis_sugerencias')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_nickname': self.user_nickname,
            'contenido': self.contenido,
            'created_at': self.created_at.isoformat()
        }