from flask_cors import CORS
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token





app = Flask(__name__)
CORS(app, origins="http://localhost:3000", supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Replace with a secure secret key

jwt = JWTManager(app)
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    user_type = db.Column(db.String(10), nullable=False)


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType')

    # Check if the user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'message': 'User already exists.'}), 409

    # Hash the password
    hashed_password = generate_password_hash(password, method='sha256')

    new_user = User(username=username, password=hashed_password, user_type=user_type)
    db.session.add(new_user)
    db.session.commit()


    return jsonify({'message': 'User created'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid username or password'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user_type': user.user_type
    }), 200

# Display all users
@app.route('/users', methods=['GET'])
def users():
    users = User.query.all()
    output = []
    for user in users:
        user_data = {}
        user_data['username'] = user.username
        user_data['password'] = user.password
        user_data['user_type'] = user.user_type
        output.append(user_data)
    return jsonify({'users': output})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

