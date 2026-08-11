from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)  # Allows React frontend to make requests to Flask backend

    from .routes import api
    app.register_blueprint(api, url_prefix='/api')

    return app