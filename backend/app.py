from flask_cors import CORS
from flask_cors import cross_origin
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
import os

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

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
    vendor_name = db.Column(db.String(80), nullable=True)
    products = db.relationship('Product', backref='vendor', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vendor_name = db.Column(db.String(80), nullable=True)



@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType')
    vendor_name = data.get('vendorName')  # add new field for vendor name

    # Check if the user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'message': 'User already exists.'}), 409

    # Hash the password
    hashed_password = generate_password_hash(password, method='sha256')

    new_user = User(username=username, password=hashed_password, user_type=user_type)
    db.session.add(new_user)
    db.session.commit()

    # add vendor name to user if it's a vendor account
    if user_type == 'vendor' and vendor_name:
        current_user = User.query.filter_by(username=username).first()
        current_user.vendor_name = vendor_name
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
        user_data['vendor_name'] = user.vendor_name
        output.append(user_data)
    return jsonify({'users': output})


@app.route('/products', methods=['GET'])
def get_all_products():
    products = Product.query.all()
    output = []
    for product in products:
        product_data = {}
        product_data['id'] = product.id
        product_data['name'] = product.name
        product_data['price'] = product.price
        product_data['description'] = product.description
        product_data['vendor_id'] = product.vendor_id
        product_data['vendor_name'] = product.vendor_name
        output.append(product_data)
    return jsonify({'products': output})


@app.route('/create-product', methods=['POST'])
@jwt_required
def create_product():

    name = request.form.get('name')
    price = request.form.get('price')
    description = request.form.get('description')

    vendor_id = get_jwt_identity()

    # Need to get the Vendors name

    new_product = Product(name=name, price=price, description=description, vendor_id=vendor_id)
    db.session.add(new_product)
    db.session.commit()

    return jsonify({'message': 'Product created'}), 201


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

