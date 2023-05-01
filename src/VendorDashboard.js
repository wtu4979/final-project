// src/VendorDashboard.js
import React, { useState } from 'react';

const VendorDashboard = () => {
	const [productName, setProductName] = useState('');
	const [productPrice, setProductPrice] = useState('');
	const [productDescription, setProductDescription] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();

		const productData = {
			name: productName,
			price: productPrice,
			description: productDescription,
		};

		// Send product data to your backend here
		console.log('Product data:', productData);

		// Reset form fields after successful submission
		setProductName('');
		setProductPrice('');
		setProductDescription('');
	};

	return (
		<div>
			<h2>Vendor Dashboard</h2>
			<h3>Create New Product</h3>
			<form onSubmit={handleSubmit}>
				<div>
					<label>Name:</label>
					<input
						type='text'
						value={productName}
						onChange={(e) => setProductName(e.target.value)}
					/>
				</div>
				<div>
					<label>Price:</label>
					<input
						type='number'
						step='0.01'
						value={productPrice}
						onChange={(e) => setProductPrice(e.target.value)}
					/>
				</div>
				<div>
					<label>Description:</label>
					<textarea
						value={productDescription}
						onChange={(e) => setProductDescription(e.target.value)}
					></textarea>
				</div>
				<button type='submit'>Create Product</button>
			</form>
		</div>
	);
};

export default VendorDashboard;
