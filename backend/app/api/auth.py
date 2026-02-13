from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

ns = Namespace('auth', description='Authentication operations')

auth_model = ns.model('Auth', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

@ns.route('/register')
class Register(Resource):
    @ns.expect(auth_model)
    @ns.doc('register_user')
    def post(self):
        """Register a new user"""
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {'message': 'Email and password are required'}, 400

        if User.query.filter_by(email=email).first():
            return {'message': 'User already exists'}, 400

        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return {'message': 'User created successfully'}, 201

@ns.route('/login')
class Login(Resource):
    @ns.expect(auth_model)
    @ns.doc('login_user')
    def post(self):
        """Login and return JWT token"""
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {'message': 'Email and password are required'}, 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return {'message': 'Invalid credentials'}, 401

        access_token = create_access_token(identity=str(user.id))
        return {'access_token': access_token}, 200
