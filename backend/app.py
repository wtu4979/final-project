from flask_cors import CORS
from flask_cors import cross_origin
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
import os
from flasgger import Swagger

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
swagger = Swagger(app)

# Database Model Classes

class User(db.Model):
    """
    This class represents the User table in the database.
    """
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
    """
    This class represents the Product table in the database.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    vendor_name = db.Column(db.String(80), nullable=True)
    shopping_cart_items = db.relationship('ShoppingCartItem', backref='product', lazy=True)


class Sale(db.Model):
    """
    This class represents the Sale table in the database.
    """
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    customer_name = db.Column(db.String(80), nullable=False)
    product_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(DECIMAL(10, 2), nullable=False)
    status = db.Column(db.String(20), default='Processing')

class ShoppingCartItem(db.Model):
    """
    This class represents the ShoppingCartItem table in the database.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=func.now())


# Helper Functions
def add_to_cart(user_id, product_id, quantity):
    item = ShoppingCartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    db.session.add(item)
    db.session.commit()

def get_cart(user_id):
    user = User.query.get(user_id)
    if user is None:
        return []
    return user.shopping_cart_items

# API Routes

@app.route('/signup', methods=['POST'])
def signup():
    """
    Create a new user
    ---
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              description: The username for the new user
              example: 'newuser'
            password:
              type: string
              description: The password for the new user
              example: 'password123'
            userType:
              type: string
              description: The type of the new user (normal or vendor)
              example: 'vendor'
            vendorName:
              type: string
              description: The vendor name (only required if userType is 'vendor')
              example: 'VendorName'
    responses:
      201:
        description: User created
      409:
        description: User already exists
    """

    # Get JSON data from the request
    data = request.get_json()

    # Extract relevant data from the JSON: username, password, userType, and vendorName
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType')
    vendor_name = data.get('vendorName')

    # Query the database to see if the user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        # If the user already exists, return a message and a conflict status code
        return jsonify({'message': 'User already exists.'}), 409

    # If the user does not exist, hash the provided password for secure storage
    hashed_password = generate_password_hash(password, method='sha256')

    # Create a new user instance with the provided username and hashed password, and specified user type
    new_user = User(username=username, password=hashed_password, user_type=user_type)

    # Add the new user to the current database session
    db.session.add(new_user)
    # Commit the current database session, effectively saving the new user to the database
    db.session.commit()

    # If the user type is 'vendor' and a vendor name has been provided
    if user_type == 'vendor' and vendor_name:
        # Fetch the newly created user from the database
        current_user = User.query.filter_by(username=username).first()
        # Update the vendor name for this user
        current_user.vendor_name = vendor_name
        # Commit the changes to the database
        db.session.commit()

    # Return a success message and a created status code
    return jsonify({'message': 'User created'}), 201


@app.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and generate access token
    ---
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              description: The username of the user
              example: 'user123'
            password:
              type: string
              description: The password of the user
              example: 'password123'
    responses:
      200:
        description: Successful authentication
        schema:
          type: object
          properties:
            access_token:
              type: string
              description: The access token for the authenticated user
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxN...'
            user_type:
              type: string
              description: The user type of the authenticated user
              example: 'normal'
      401:
        description: Invalid username or password
    """
    # Get JSON data from the request
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Query the database for a user with the given username
    user = User.query.filter_by(username=username).first()

    # If the user does not exist or the password does not match
    if not user or not check_password_hash(user.password, password):
        # Return an error message and unauthorized status code
        return jsonify({'message': 'Invalid username or password'}), 401

    # If the user exists and the password matches, create an access token for the user
    access_token = create_access_token(identity=user.id)
    # Return the access token and user type in the response
    return jsonify({
        'access_token': access_token,
        'user_type': user.user_type
    }), 200

# Display all users
@app.route('/users', methods=['GET'])
def users():
    """
    Get all users
    ---
    responses:
      200:
        description: List of all users
        schema:
          type: object
          properties:
            users:
              type: array
              items:
                type: object
                properties:
                  username:
                    type: string
                    description: The username of the user
                  password:
                    type: string
                    description: The password of the user
                  user_type:
                    type: string
                    description: The type of the user
                  vendor_name:
                    type: string
                    description: The name of the vendor (if applicable)
                  vendor_revenue:
                    type: number
                    description: The revenue of the vendor (if applicable)
                  products:
                    type: array
                    items:
                      type: object
                      description: The products associated with the user (if applicable)
                      # Add properties as needed for the product object
                  shopping_cart_items:
                    type: array
                    items:
                      type: object
                      description: The shopping cart items associated with the user (if applicable)
                      # Add properties as needed for the shopping cart item object
    """
    # Query the database for all users
    users = User.query.all()
    output = []
    # Iterate over all users
    for user in users:
        # Create a dictionary to store user data
        user_data = {}
        # Populate the dictionary with data from the user
        user_data['username'] = user.username
        user_data['password'] = user.password
        user_data['user_type'] = user.user_type
        user_data['vendor_name'] = user.vendor_name
        user_data['vendor_revenue'] = user.vendor_revenue
        user_data['products'] = user.products
        user_data['shopping_cart_items'] = user.shopping_cart_items
        # Append the user data to the output list
        output.append(user_data)
    # Return the list of all users in the response
    return jsonify({'users': output})


@app.route('/products', methods=['GET'])
def get_all_products():
    """
    Get all products
    ---
    responses:
      200:
        description: List of all products
        schema:
          type: object
          properties:
            products:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    description: The ID of the product
                  name:
                    type: string
                    description: The name of the product
                  price:
                    type: number
                    description: The price of the product
                  description:
                    type: string
                    description: The description of the product
                  vendor_id:
                    type: integer
                    description: The ID of the vendor associated with the product
                  vendor_name:
                    type: string
                    description: The name of the vendor associated with the product
    """
    # Query the database for all products
    products = Product.query.all()
    output = []
    # Iterate over all products
    for product in products:
        # Create a dictionary to store product data
        product_data = {}
        # Populate the dictionary with data from the product
        product_data['id'] = product.id
        product_data['name'] = product.name
        product_data['price'] = product.price
        product_data['description'] = product.description
        product_data['vendor_id'] = product.vendor_id
        product_data['vendor_name'] = product.vendor_name
        # Append the product data to the output list
        output.append(product_data)
    # Return the list of all products in the response
    return jsonify({'products': output})


@app.route('/create-product', methods=['POST'])
@jwt_required()
def create_product():
    """
    Create a new product
    ---
    security:
      - JWT: []
    parameters:
      - in: formData
        name: name
        type: string
        required: true
        description: The name of the product
      - in: formData
        name: price
        type: number
        required: true
        description: The price of the product
      - in: formData
        name: description
        type: string
        required: true
        description: The description of the product
    responses:
      201:
        description: Product created
    """
    # Get form data from the request
    name = request.form.get('name')
    price = request.form.get('price')
    description = request.form.get('description')

    # Get the id of the current user from the JWT
    vendor_id = get_jwt_identity()

    # Query the database for the current user (the vendor)
    vendor = User.query.filter_by(id=vendor_id).first()
    # Create a new product with the provided data and vendor information
    new_product = Product(name=name, price=price, description=description, vendor_id=vendor_id, vendor_name=vendor.vendor_name)
    
    # Add the new product to the current database session
    db.session.add(new_product)
    # Commit the current database session, effectively saving the new product to the database
    db.session.commit()

    # Return a success message and a created status code
    return jsonify({'message': 'Product created'}), 201

    

@app.route('/shopping-cart', methods=['GET'])
def get_all_shopping_cart_items():
    """
    Get all shopping cart items for all users
    ---
    responses:
      200:
        description: List of shopping cart items for all users
        schema:
          type: object
          properties:
            users:
              type: array
              items:
                type: object
                properties:
                  username:
                    type: string
                    description: The username of the user
                  user_type:
                    type: string
                    description: The type of the user
                  vendor_name:
                    type: string
                    description: The name of the vendor (if applicable)
                  shopping_cart_items:
                    type: array
                    items:
                      type: object
                      description: The shopping cart items for the user
                      # Add properties as needed for the shopping cart item object
    """
    # Query all users from the database
    users = User.query.all()
    output = []
    # Iterate through each user
    for user in users:
        user_data = {}
        user_data['username'] = user.username
        user_data['user_type'] = user.user_type
        user_data['vendor_name'] = user.vendor_name
        # Call the function get_cart() to retrieve cart items for the user
        user_data['shopping_cart_items'] = get_cart(user.id)
        output.append(user_data)
    return jsonify({'users': output})

@app.route('/add-to-cart', methods=['POST'])
@jwt_required()
def add_product_to_shopping_cart():
    """
    Add a product to the shopping cart
    ---
    security:
      - JWT: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            productId:
              type: integer
              description: The ID of the product to add to the cart
            quantity:
              type: integer
              description: The quantity of the product to add (default is 1 if not provided)
    responses:
      201:
        description: Product added to cart
    """
    # Get the user's ID from the JWT
    user_id = get_jwt_identity()
    # Get the request data in JSON format
    data = request.get_json()
    # Extract the product ID and quantity from the data
    product_id = data.get('productId')
    quantity = data.get('quantity', 1)  # Default to 1 if quantity is not provided
    # Call the function add_to_cart() to add the product to the user's cart
    add_to_cart(user_id, product_id, quantity)
    return jsonify({'message': 'Product added to cart'}), 201

@app.route('/api/remove-from-cart', methods=['POST'])
@jwt_required()
def remove_from_cart():
    """
    Remove an item from the shopping cart
    ---
    security:
      - JWT: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            cartItemId:
              type: integer
              description: The ID of the cart item to remove
    responses:
      200:
        description: Item removed from cart
      404:
        description: Item not found in cart
    """
    # Get the user's ID from the JWT
    user_id = get_jwt_identity()
    # Get the request data in JSON format
    data = request.get_json()
    # Extract the cart item ID from the data
    cart_item_id = data.get('cartItemId')
    # Query the database for the item in the user's cart
    item = ShoppingCartItem.query.filter_by(user_id=user_id, id=cart_item_id).first()
    if item:
        # If the item is found, delete it from the cart
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removed from cart'}), 200
    else:
        # If the item is not found, return an error message
        return jsonify({'error': 'Item not found in cart'}), 404


@app.route('/api/shopping_cart', methods=['GET'])
@jwt_required()
def get_user_cart_info():
    """
    Get user's shopping cart information
    ---
    security:
      - JWT: []
    responses:
      200:
        description: User's shopping cart information
        schema:
          type: object
          properties:
            cart:
              type: array
              items:
                type: object
                properties:
                  cart_item_id:
                    type: integer
                    description: The ID of the cart item
                  product_id:
                    type: integer
                    description: The ID of the product
                  product_name:
                    type: string
                    description: The name of the product
                  product_price:
                    type: number
                    description: The price of the product
                  product_description:
                    type: string
                    description: The description of the product
                  vendor_id:
                    type: integer
                    description: The ID of the vendor
                  vendor_name:
                    type: string
                    description: The name of the vendor
                  quantity:
                    type: integer
                    description: The quantity of the product in the cart
    """
    # Query the database for the user
    user = User.query.get(get_jwt_identity())
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    cart_items = []
    # Iterate through the user's shopping cart items
    for item in user.shopping_cart_items:
        # Query the database for the product
        product = Product.query.get(item.product_id)
        if product is None:
            continue
        # Append the item's data to the cart_items list
        cart_item = {
            'cart_item_id': item.id, 
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
    """
    Place an order based on the items in the shopping cart
    ---
    security:
      - JWT: []
    responses:
      200:
        description: Information about vendor purchases
        schema:
          type: object
          additionalProperties:
            type: object
            properties:
              vendor_name:
                type: string
                description: The name of the vendor
              total:
                type: number
                description: The total price of purchases from the vendor
              products:
                type: array
                items:
                  type: string
                description: The products purchased from the vendor
    """
    # Get the user's ID from the JWT
    user_id = get_jwt_identity()
    # Query the database for the user and their cart items
    user = User.query.get(user_id)
    cart_items = ShoppingCartItem.query.filter_by(user_id=user_id).all()

    if not cart_items:
        # If the cart is empty, return an error message
        return jsonify({'message': 'Shopping cart is empty'}), 400

    vendor_purchases = {}

    # Iterate through the cart items
    for item in cart_items:
        # Query the database for the product
        product = Product.query.get(item.product_id)
        if product is None:
            continue

        vendor_id = product.vendor_id
        # Query the database for the vendor
        vendor = User.query.get(vendor_id)

        # Create a new sale record
        sale = Sale(vendor_id=vendor_id, customer_name=user.username, product_name=product.name, quantity=item.quantity, total_price=product.price * item.quantity)
        db.session.add(sale)

        # Update the vendor's total purchases and revenue
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
        # Remove the item from the cart
        db.session.delete(item)

    # Commit the changes to the database
    db.session.commit()

    return jsonify(vendor_purchases)



@app.route('/get-vendor-revenue', methods=['GET'])
@jwt_required()
def get_vendor_revenue():
    """
    Get the revenue for a vendor
    ---
    security:
      - JWT: []
    responses:
      200:
        description: Vendor revenue information
        schema:
          type: object
          properties:
            vendor_name:
              type: string
              description: The name of the vendor
            vendor_revenue:
              type: string
              description: The revenue of the vendor
    """
    # Get the vendor's ID from the JWT
    vendor_id = get_jwt_identity()
    # Query the database for the vendor
    vendor = User.query.get(vendor_id)
    if vendor is None:
        return jsonify({'error': 'Vendor not found'}), 404

    # Print the vendor's revenue
    print(f"Vendor ID: {vendor.id}, Vendor Name: {vendor.vendor_name}, Vendor Revenue: {vendor.vendor_revenue}")

    return jsonify({'vendor_name': vendor.vendor_name, 'vendor_revenue': str(vendor.vendor_revenue)})

@app.route('/get_sales', methods=['GET'])
@jwt_required()
def get_all_sales():
    """
    Get all sales records
    ---
    security:
      - JWT: []
    responses:
      200:
        description: List of all sales records
        schema:
          type: object
          properties:
            sales:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    description: The ID of the sale
                  vendor_id:
                    type: integer
                    description: The ID of the vendor
                  customer_name:
                    type: string
                    description: The name of the customer
                  product_name:
                    type: string
                    description: The name of the product
                  quantity:
                    type: integer
                    description: The quantity of the product sold
                  total_price:
                    type: string
                    description: The total price of the sale
                  status:
                    type: string
                    description: The status of the sale
    """
    # Query the database for all sales
    sales = Sale.query.all()
    output = []

    # Iterate through the sales
    for sale in sales:
        # Append each sale's data to the output list
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
    """
    Change the status of a sale to "Shipped"
    ---
    security:
      - JWT: []
    parameters:
      - in: path
        name: sale_id
        required: true
        type: integer
        description: The ID of the sale to update
    responses:
      200:
        description: Sale status changed to shipping
      400:
        description: Sale is already in shipping status
      404:
        description: Sale not found
    """
    # Query the database for the sale
    sale = Sale.query.get(sale_id)
    if sale is None:
        return jsonify({'error': 'Sale not found'}), 404

    # If the sale has already been shipped, return an error message
    if sale.status == 'Shipped':
        return jsonify({'error': 'Sale is already in shipping status'}), 400

    # Change the sale's status to "Shipped"
    sale.status = 'Shipped'
    # Commit the changes to the database
    db.session.commit()

    return jsonify({'success': True, 'message': 'Sale status changed to shipping'}), 200

# Endpoint to get a user's orders
@app.route('/get_orders', methods=['GET'])
@jwt_required()
def get_orders():
    """
    Get a user's orders
    ---
    security:
      - JWT: []
    responses:
      200:
        description: List of user's orders
        schema:
          type: object
          properties:
            orders:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    description: The ID of the order
                  vendor_id:
                    type: integer
                    description: The ID of the vendor
                  vendor_name:
                    type: string
                    description: The name of the vendor
                  product_name:
                    type: string
                    description: The name of the product
                  quantity:
                    type: integer
                    description: The quantity of the product in the order
                  total_price:
                    type: string
                    description: The total price of the order
                  status:
                    type: string
                    description: The status of the order
    """
    # Get the user's ID from the JWT
    user_id = get_jwt_identity() 
    # Query the database for the user
    user = User.query.get(user_id)
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    # Query the database for the user's orders
    orders = Sale.query.filter_by(customer_name=user.username).all() 
    output = []

    # Iterate through the orders
    for order in orders:
        # Append each order's data to the output list
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
    """
    Get all products
    ---
    responses:
      200:
        description: List of all products
        schema:
          type: object
          properties:
            products:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    description: The ID of the product
                  name:
                    type: string
                    description: The name of the product
                  price:
                    type: string
                    description: The price of the product
                  description:
                    type: string
                    description: The description of the product
                  vendor_id:
                    type: integer
                    description: The ID of the vendor
                  vendor_name:
                    type: string
                    description: The name of the vendor
    """
    # Query all products from the database
    products = Product.query.all()
    output = []
    for product in products:
        # Construct a dictionary for each product
        product_data = {}
        product_data['id'] = product.id
        product_data['name'] = product.name
        product_data['price'] = product.price
        product_data['description'] = product.description
        product_data['vendor_id'] = product.vendor_id
        product_data['vendor_name'] = product.vendor_name
        # Append each product to the output list
        output.append(product_data)
    # Return the list of products as a JSON response
    return jsonify({'products': output})

# Route to update a product's information
@app.route('/update-product/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """
    Update a product
    ---
    security:
      - JWT: []
    parameters:
      - in: path
        name: product_id
        required: true
        type: integer
        description: The ID of the product to update
      - in: body
        name: product
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              description: The name of the product
            price:
              type: string
              description: The price of the product
            description:
              type: string
              description: The description of the product
    responses:
      200:
        description: Product updated successfully
      403:
        description: Unauthorized to update this product
      404:
        description: Product not found
    """
    # Query the database for the product
    product = Product.query.get(product_id)
    
    # If the product is not found, return an error
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    # Get the current vendor's ID from the JWT
    current_vendor_id = get_jwt_identity()

    # If the product's vendor ID doesn't match the current vendor's ID, return an error
    if product.vendor_id != current_vendor_id:
        return jsonify({'error': 'You do not have permission to update this product'}), 403

    data = request.get_json()

    # Update the product's information
    if 'name' in data:
        product.name = data['name']
    if 'price' in data:
        product.price = data['price']
    if 'description' in data:
        product.description = data['description']

    # Commit the changes to the database
    db.session.commit()

    # Return a success message
    return jsonify({'message': 'Product updated'}), 200

# Route to get a specific product by its ID
@app.route('/get_product/<int:productId>', methods=['GET'])
def get_product(productId):
    """
    Get a specific product by ID
    ---
    parameters:
      - in: path
        name: productId
        required: true
        type: integer
        description: The ID of the product to retrieve
    responses:
      200:
        description: The requested product
        schema:
          type: object
          properties:
            product:
              type: object
              properties:
                id:
                  type: integer
                  description: The ID of the product
                name:
                  type: string
                  description: The name of the product
                price:
                  type: string
                  description: The price of the product
                description:
                  type: string
                  description: The description of the product
                vendor_id:
                  type: integer
                  description: The ID of the vendor
                vendor_name:
                  type: string
                  description: The name of the vendor
      404:
        description: Product not found
    """
    # Query the database for the product using the provided ID
    product = Product.query.get(productId)
    if product is None:
        # If no product was found with the provided ID, return an error
        return jsonify({'error': 'Product not found'}), 404

    # Otherwise, create a dictionary with the product's data
    product_data = {}
    product_data['id'] = product.id
    product_data['name'] = product.name
    product_data['price'] = product.price
    product_data['description'] = product.description
    product_data['vendor_id'] = product.vendor_id
    product_data['vendor_name'] = product.vendor_name

    # Return the product data as a JSON response
    return jsonify({'product': product_data}), 200

# Route to get a specific order by its ID
@app.route('/get_order/<int:orderId>', methods=['GET'])
def get_order(orderId):
    """
    Get a specific order by ID
    ---
    parameters:
      - in: path
        name: orderId
        required: true
        type: integer
        description: The ID of the order to retrieve
    responses:
      200:
        description: The requested order
        schema:
          type: object
          properties:
            order:
              type: object
              properties:
                id:
                  type: integer
                  description: The ID of the order
                product_name:
                  type: string
                  description: The name of the product in the order
                customer_name:
                  type: string
                  description: The name of the customer who placed the order
                quantity:
                  type: integer
                  description: The quantity of the product in the order
                total_price:
                  type: string
                  description: The total price of the order
                status:
                  type: string
                  description: The status of the order
      404:
        description: Order not found
    """
    # Query the database for the order using the provided ID
    order = Sale.query.get(orderId)
    if order is None:
        # If no order was found with the provided ID, return an error
        return jsonify({'error': 'Order not found'}), 404

    # Otherwise, create a dictionary with the order's data
    order_data = {}
    order_data['id'] = order.id
    order_data['product_name'] = order.product_name
    order_data['customer_name'] = order.customer_name
    order_data['quantity'] = order.quantity
    order_data['total_price'] = order.total_price
    order_data['status'] = order.status

    # Return the order data as a JSON response
    return jsonify({'order': order_data}), 200

# Route to delete a product by its ID
@app.route('/delete-product/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """
    Delete a product by ID
    ---
    security:
      - JWT: []
    parameters:
      - in: path
        name: product_id
        required: true
        type: integer
        description: The ID of the product to delete
    responses:
      200:
        description: Product deleted successfully
      403:
        description: Unauthorized to delete this product
      404:
        description: Product not found
    """
    # Query the database for the product using the provided ID
    product = Product.query.get(product_id)
    
    # If no product was found with the provided ID, return an error
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    # Get the current vendor's ID from the JWT
    current_vendor_id = get_jwt_identity()

    # If the product's vendor ID doesn't match the current vendor's ID, return an error
    if product.vendor_id != current_vendor_id:
        return jsonify({'error': 'You do not have permission to delete this product'}), 403

    # Delete the product from the database
    db.session.delete(product)
    db.session.commit()

    # Return a success message
    return jsonify({'message': 'Product deleted'}), 200



if __name__ == '__main__':
    with app.app_context():
        # Only uncomment this line if you want to recreate/update the database. After running once, comment it out again so you don't lose your data!
        # db.drop_all()
        db.create_all()
    app.run(debug=True)

