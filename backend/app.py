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
from sqlalchemy.sql import func
from sqlalchemy import Numeric, DECIMAL
from decimal import Decimal


app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': 'http://localhost:3000'}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Replace with a secure secret key

jwt = JWTManager(app)
db = SQLAlchemy(app)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    customer_name = db.Column(db.String(80), nullable=False)
    product_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(DECIMAL(10, 2), nullable=False)
    status = db.Column(db.String(20), default='Processing')


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    user_type = db.Column(db.String(10), nullable=False)
    vendor_name = db.Column(db.String(80), nullable=True)
    vendor_revenue = db.Column(DECIMAL(10, 2), nullable=True, default=0.00)
    products = db.relationship('Product', backref='vendor', lazy=True)
    shopping_cart_items = db.relationship('ShoppingCartItem', backref='user', lazy=True)
    sales = db.relationship('Sale', backref='vendor', lazy=True)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vendor_name = db.Column(db.String(80), nullable=True)
    shopping_cart_items = db.relationship('ShoppingCartItem', backref='product', lazy=True)


class ShoppingCartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=func.now())



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
        user_data['vendor_revenue'] = user.vendor_revenue
        user_data['products'] = user.products
        user_data['shopping_cart_items'] = user.shopping_cart_items
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
@jwt_required()
def create_product():

    name = request.form.get('name')
    price = request.form.get('price')
    description = request.form.get('description')

    vendor_id = get_jwt_identity()

    # Need to get the Vendors name
    vendor = User.query.filter_by(id=vendor_id).first()
    new_product = Product(name=name, price=price, description=description, vendor_id=vendor_id, vendor_name=vendor.vendor_name)
    db.session.add(new_product)
    db.session.commit()

    return jsonify({'message': 'Product created'}), 201
    

def add_to_cart(user_id, product_id, quantity):
    item = ShoppingCartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    db.session.add(item)
    db.session.commit()

def get_cart(user_id):
    user = User.query.get(user_id)
    if user is None:
        return []
    return user.shopping_cart_items


# NEED TO FIX
@app.route('/shopping-cart', methods=['GET'])
# Get all users and their shopping cart items
def get_all_shopping_cart_items():
    users = User.query.all()
    output = []
    for user in users:
        user_data = {}
        user_data['username'] = user.username
        user_data['user_type'] = user.user_type
        user_data['vendor_name'] = user.vendor_name
        user_data['shopping_cart_items'] = get_cart(user.id)
        output.append(user_data)
    return jsonify({'users': output})

@app.route('/add-to-cart', methods=['POST'])
@jwt_required()
def add_product_to_shopping_cart():
    user_id = get_jwt_identity()
    data = request.get_json()
    product_id = data.get('productId')
    quantity = data.get('quantity', 1)  # Default to 1 if quantity is not provided
    add_to_cart(user_id, product_id, quantity)
    return jsonify({'message': 'Product added to cart'}), 201

@app.route('/api/remove-from-cart', methods=['POST'])
@jwt_required()
def remove_from_cart():
    user_id = get_jwt_identity()
    data = request.get_json()
    cart_item_id = data.get('cartItemId') # Change this to cart_item_id

    # Find the item in the cart
    item = ShoppingCartItem.query.filter_by(user_id=user_id, id=cart_item_id).first() # Change this to id=cart_item_id
    if item:
        # Remove the item from the cart
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removed from cart'}), 200
    else:
        return jsonify({'error': 'Item not found in cart'}), 404


@app.route('/api/shopping_cart', methods=['GET'])
@jwt_required()
def get_user_cart_info():
    user = User.query.get(get_jwt_identity())
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    cart_items = []
    for item in user.shopping_cart_items:
        product = Product.query.get(item.product_id)
        if product is None:
            continue

        cart_item = {
            'cart_item_id': item.id, # Add the cart_item_id to the response
            'product_id': product.id,
            'product_name': product.name,
            'product_price': product.price,
            'product_description': product.description,
            'vendor_id': product.vendor_id,
            'vendor_name': product.vendor_name,
            'quantity': item.quantity
        }
        cart_items.append(cart_item)

    return jsonify({'cart': cart_items})

@app.route('/place-order', methods=['POST'])
@jwt_required()
def place_order():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    cart_items = ShoppingCartItem.query.filter_by(user_id=user_id).all()

    if not cart_items:
        return jsonify({'message': 'Shopping cart is empty'}), 400

    vendor_purchases = {}

    for item in cart_items:
        product = Product.query.get(item.product_id)
        if product is None:
            continue

        vendor_id = product.vendor_id
        vendor = User.query.get(vendor_id)

        sale = Sale(vendor_id=vendor_id, customer_name=user.username, product_name=product.name, quantity=item.quantity, total_price=product.price * item.quantity)
        db.session.add(sale)

        if vendor_id in vendor_purchases:
            vendor_purchases[vendor_id]['total'] += product.price * item.quantity
            vendor_purchases[vendor_id]['products'].append(product.name)
        else:
            vendor_purchases[vendor_id] = {
                'vendor_name': vendor.vendor_name,
                'total': product.price * item.quantity,
                'products': [product.name]
            }

        vendor.vendor_revenue += Decimal(product.price) * Decimal(item.quantity)
        db.session.delete(item)

    db.session.commit()

    return jsonify(vendor_purchases)


@app.route('/get-vendor-revenue', methods=['GET'])
@jwt_required()
def get_vendor_revenue():
    vendor_id = get_jwt_identity()
    vendor = User.query.get(vendor_id)
    if vendor is None:
        return jsonify({'error': 'Vendor not found'}), 404

    print(f"Vendor ID: {vendor.id}, Vendor Name: {vendor.vendor_name}, Vendor Revenue: {vendor.vendor_revenue}")

    return jsonify({'vendor_name': vendor.vendor_name, 'vendor_revenue': str(vendor.vendor_revenue)})

@app.route('/get_sales', methods=['GET'])
@jwt_required()
def get_all_sales():
    sales = Sale.query.all()
    output = []

    for sale in sales:
        sale_data = {}
        sale_data['id'] = sale.id
        sale_data['vendor_id'] = sale.vendor_id
        sale_data['customer_name'] = sale.customer_name
        sale_data['product_name'] = sale.product_name
        sale_data['quantity'] = sale.quantity
        sale_data['total_price'] = str(sale.total_price)
        sale_data['status'] = sale.status
        output.append(sale_data)

    print(output)

    return jsonify({'sales': output})

@app.route('/change_status_to_shipping/<int:sale_id>', methods=['POST'])
@jwt_required()
def change_status_to_shipping(sale_id):
    sale = Sale.query.get(sale_id)
    if sale is None:
        return jsonify({'error': 'Sale not found'}), 404

    if sale.status == 'Shipped':
        return jsonify({'error': 'Sale is already in shipping status'}), 400

    sale.status = 'Shipped'
    db.session.commit()

    return jsonify({'success': True, 'message': 'Sale status changed to shipping'}), 200

@app.route('/get_orders', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity() 
    user = User.query.get(user_id)
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    orders = Sale.query.filter_by(customer_name=user.username).all() 
    output = []

    for order in orders:
        order_data = {}
        order_data['id'] = order.id
                # Get vendor for the order
        vendor = User.query.get(order.vendor_id)
        if vendor is None:
            order_data['vendor_name'] = 'Vendor not found'
        else:
            order_data['vendor_name'] = vendor.vendor_name
        order_data['vendor_id'] = order.vendor_id
        order_data['product_name'] = order.product_name
        order_data['quantity'] = order.quantity
        order_data['total_price'] = str(order.total_price)
        order_data['status'] = order.status
        output.append(order_data)

    return jsonify({'orders': output})

@app.route('/get_products', methods=['GET'])
def get_vendor_products():
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

@app.route('/update-product/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    # Get product by id
    product = Product.query.get(product_id)
    
    # If product is not found
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    # Get current vendor id
    current_vendor_id = get_jwt_identity()

    # If the product doesn't belong to the current vendor
    if product.vendor_id != current_vendor_id:
        return jsonify({'error': 'You do not have permission to update this product'}), 403

    data = request.get_json()

    # Update product details
    if 'name' in data:
        product.name = data['name']
    if 'price' in data:
        product.price = data['price']
    if 'description' in data:
        product.description = data['description']

    db.session.commit()

    return jsonify({'message': 'Product updated'}), 200

@app.route('/get_product/<int:productId>', methods=['GET'])
def get_product(productId):
    product = Product.query.get(productId)
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    product_data = {}
    product_data['id'] = product.id
    product_data['name'] = product.name
    product_data['price'] = product.price
    product_data['description'] = product.description
    product_data['vendor_id'] = product.vendor_id
    product_data['vendor_name'] = product.vendor_name

    return jsonify({'product': product_data}), 200

@app.route('/get_order/<int:orderId>', methods=['GET'])
def get_order(orderId):
    order = Sale.query.get(orderId)
    if order is None:
        return jsonify({'error': 'Order not found'}), 404

    order_data = {}
    order_data['id'] = order.id
    order_data['product_name'] = order.product_name
    order_data['customer_name'] = order.customer_name
    order_data['quantity'] = order.quantity
    order_data['total_price'] = order.total_price
    order_data['status'] = order.status

    return jsonify({'order': order_data}), 200



@app.route('/delete-product/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    # Get product by id
    product = Product.query.get(product_id)
    
    # If product is not found
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    # Get current vendor id
    current_vendor_id = get_jwt_identity()

    # If the product doesn't belong to the current vendor
    if product.vendor_id != current_vendor_id:
        return jsonify({'error': 'You do not have permission to delete this product'}), 403

    # Delete product
    db.session.delete(product)
    db.session.commit()

    return jsonify({'message': 'Product deleted'}), 200


if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        db.create_all()
    app.run(debug=True)

