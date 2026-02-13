from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_caching import Cache
from celery import Celery
from config import config
import os

db = SQLAlchemy()
migrate = Migrate()
cache = Cache()
celery = Celery(__name__)

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import models so Alembic can detect them
    from app import models

    cache.init_app(app)
    
    # Configure Celery
    celery.conf.update(app.config)
    
    # Task context for Celery
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    
    @app.route('/health')
    def health_check():
        return jsonify({"status": "ok"})
    
    return app
