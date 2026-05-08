from app import app, db, Juego
import os

with app.app_context():
    juegos = Juego.query.all()
    for juego in juegos:
        nueva_foto = f"/static/covers/{juego.slug}.jpg"
        print(f"Updating {juego.nombre}: {juego.foto_portada} -> {nueva_foto}")
        juego.foto_portada = nueva_foto
    
    db.session.commit()
    print("Base de datos actualizada con exito!")
