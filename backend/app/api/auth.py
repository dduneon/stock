from flask_restx import Namespace, Resource, fields
from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

ns = Namespace('auth', description='Authentication operations')

auth_model = ns.model('Auth', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

register_model = ns.model('Register', {
    'username': fields.String(required=True, description='Username'),
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

@ns.route('/register')
class Register(Resource):
    @ns.expect(register_model)
    @ns.doc('register_user')
    def post(self):
        """Register a new user"""
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return {'message': 'Username, email and password are required'}, 400

        if User.query.filter_by(username=username).first():
            return {'message': 'Username already exists'}, 400

        if User.query.filter_by(email=email).first():
            return {'message': 'User already exists'}, 400

        user = User(email=email)
        user.username = username
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

@ns.route('/me')
class Me(Resource):
    @ns.doc('get_current_user')
    @jwt_required()
    def get(self):
        """Get current authenticated user"""
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return {'message': 'User not found'}, 404
        
        return {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, 200
