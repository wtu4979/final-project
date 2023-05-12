// src/VendorDashboard.js
import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from '@mui/material';
import ProductsForSale from './ProductsForSale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const SalesHistory = () => {
	const [sales, setSales] = useState([]);

	const changeToShipping = async (sale_id) => {
		try {
			const response = await fetch(
				`http://127.0.0.1:5000/change_status_to_shipping/${sale_id}`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('access_token')}`,
					},
				}
			);

			const data = await response.json();

			if (data.success) {
				setSales(
					sales.map((sale) =>
						sale.id === sale_id ? { ...sale, status: 'Shipped' } : sale
					)
				);
			} else {
				console.error('Error changing status to shipping');
			}
		} catch (error) {
			console.error('Error changing status to shipping:', error);
		}
	};

	useEffect(() => {
		const fetchSales = async () => {
			try {
				const response = await fetch('http://127.0.0.1:5000/get_sales', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('access_token')}`,
					},
				});
				const data = await response.json();

				setSales(data.sales);
			} catch (error) {
				console.error('Error fetching sales history:', error);
			}
		};

		fetchSales();
	}, []);

	return (
		<Box
			display='flex'
			justifyContent='center'
			alignItems='center'
			m={1}
			p={1}
			mt={5}
			flexDirection='column'
		>
			<Typography variant='h4' gutterBottom component='div'>
				Sales History
			</Typography>
			<TableContainer component={Paper} style={{ maxWidth: '100%' }}>
				<Table sx={{ minWidth: 650 }} aria-label='simple table'>
					<TableHead>
						<TableRow>
							<TableCell align='center'>Order ID</TableCell>

							<TableCell align='center'>Product Name</TableCell>
							<TableCell align='center'>Quantity Sold</TableCell>
							<TableCell align='center'>Sold Price</TableCell>
							<TableCell align='right'>Customer</TableCell>
							<TableCell align='center'>Current Status</TableCell>
							<TableCell align='center'>Change Status</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sales.map((sale, index) => (
							<TableRow
								key={sale.product_id + index}
								sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
							>
								<TableCell align='center'>{sale.id}</TableCell>
								<TableCell align='center' component='th' scope='row'>
									{sale.product_name}
								</TableCell>
								<TableCell align='center'>{sale.quantity}</TableCell>
								<TableCell align='center'>${sale.total_price}</TableCell>
								<TableCell align='right'>{sale.customer_name}</TableCell>
								<TableCell align='center'>
									{sale.status}
									{sale.status === 'Shipped' && (
										<FontAwesomeIcon
											icon={faCheckCircle}
											style={{ color: 'green', marginLeft: '5px' }}
										/>
									)}
									{sale.status === 'Processing' && (
										<FontAwesomeIcon
											icon={faSpinner}
											spin
											style={{ color: 'blue', marginLeft: '5px' }}
										/>
									)}
								</TableCell>

								<TableCell align='center'>
									<Button
										variant='contained'
										color='primary'
										disabled={sale.status === 'Shipped'}
										onClick={() => changeToShipping(sale.id)}
									>
										Ship Order
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};

const VendorDashboard = () => {
	const [productName, setProductName] = useState('');
	const [productPrice, setProductPrice] = useState('');
	const [productDescription, setProductDescription] = useState('');
	const [productImage, setProductImage] = useState(null);
	const [vendorRevenue, setVendorRevenue] = useState(null);

	const [searchProductId, setSearchProductId] = useState(''); // for the input field
	const [searchedProduct, setSearchedProduct] = useState(null);

	const [searchOrderId, setSearchOrderId] = useState(''); // New state variable
	const [searchedOrder, setSearchedOrder] = useState(null); // New state variable

	useEffect(() => {
		const fetchVendorRevenue = async () => {
			try {
				const response = await fetch(
					'http://127.0.0.1:5000/get-vendor-revenue',
					{
						method: 'GET',
						headers: {
							Authorization: `Bearer ${localStorage.getItem('access_token')}`,
						},
					}
				);
				const data = await response.json();

				setVendorRevenue(parseFloat(data.vendor_revenue)); // Parse revenue to float
			} catch (error) {
				console.error('Error fetching vendor revenue:', error);
			}
		};

		fetchVendorRevenue();
	}, []);

	const handleImageChange = (e) => {
		if (e.target.files && e.target.files[0]) {
			setProductImage(e.target.files[0]);
		}
	};

	const fetchOrderById = async () => {
		try {
			const response = await fetch(
				`http://127.0.0.1:5000/get_order/${searchOrderId}`, // Change this to your actual API
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('access_token')}`,
					},
				}
			);
			const data = await response.json();
			setSearchedOrder(data.order);
		} catch (error) {
			console.error('Error fetching order:', error);
			setSearchedOrder(null);
		}
	};

	const handleSearchOrder = () => {
		fetchOrderById();
	};

	const fetchProductById = async () => {
		try {
			const response = await fetch(
				`http://127.0.0.1:5000/get_product/${searchProductId}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('access_token')}`,
					},
				}
			);
			const data = await response.json();
			setSearchedProduct(data.product);
		} catch (error) {
			console.error('Error fetching product:', error);
			setSearchedProduct(null);
		}
	};

	const handleSearch = () => {
		fetchProductById();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		const formData = new FormData();
		formData.append('name', productName);
		formData.append('price', productPrice);
		formData.append('description', productDescription);
		if (productImage) {
			formData.append('image', productImage);
		}

		console.log(formData);

		const response = await fetch('http://127.0.0.1:5000/create-product', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('access_token')}`,
			},
			body: formData,
		});

		if (response.ok) {
			// Reset form fields after successful submission
			setProductName('');
			setProductPrice('');
			setProductDescription('');
			setProductImage(null);
			console.log('Product created');
		} else {
			console.error('Error creating product');
		}
	};

	return (
		<Grid
			container
			direction='column'
			justifyContent='center'
			alignItems='center'
			style={{ minHeight: '50vh' }}
			mt={5}
		>
			<Grid
				item
				xs={12}
				sm={8}
				md={8}
				lg={8}
				style={{ width: '80%', maxWidth: '500px' }}
			>
				<Typography variant='h4' gutterBottom>
					Vendor Dashboard
				</Typography>
				<Typography variant='h5' gutterBottom>
					Your Revenue: $
					{vendorRevenue === null ? 'Loading...' : vendorRevenue.toFixed(2)}
				</Typography>
				<Typography variant='h6' gutterBottom>
					Create New Product
				</Typography>
				<form onSubmit={handleSubmit}>
					<Box mb={2}>
						<TextField
							label='Name'
							variant='outlined'
							value={productName}
							onChange={(e) => setProductName(e.target.value)}
							fullWidth
						/>
					</Box>
					<Box mb={2}>
						<TextField
							label='Price'
							type='number'
							step='0.01'
							variant='outlined'
							value={productPrice}
							onChange={(e) => setProductPrice(e.target.value)}
							fullWidth
						/>
					</Box>
					<Box mb={2}>
						<TextField
							label='Description'
							variant='outlined'
							value={productDescription}
							onChange={(e) => setProductDescription(e.target.value)}
							fullWidth
							multiline
							rows={4}
						/>
					</Box>
					<Button type='submit' variant='contained' color='primary'>
						Create Product
					</Button>
				</form>
			</Grid>
			<ProductsForSale></ProductsForSale>
			<Box mb={2}>
				<Typography variant='h6' gutterBottom>
					Search for a Product by ID
				</Typography>
				<TextField
					label='Product ID'
					variant='outlined'
					value={searchProductId}
					onChange={(e) => setSearchProductId(e.target.value)}
					fullWidth
				/>
				<Button
					sx={{ marginTop: '20px', width: '100%' }}
					variant='contained'
					color='primary'
					onClick={handleSearch}
				>
					Search
				</Button>
				{searchedProduct && (
					<Box mt={3}>
						<Typography variant='h6' gutterBottom>
							Product Found:
						</Typography>
						<TableContainer component={Paper}>
							<Table aria-label='simple table'>
								<TableHead>
									<TableRow>
										<TableCell align='center'>Product ID</TableCell>
										<TableCell align='center'>Name</TableCell>
										<TableCell align='center'>Price</TableCell>
										<TableCell align='center'>Description</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell component='th' scope='row' align='center'>
											{searchedProduct.id}
										</TableCell>
										<TableCell align='center'>{searchedProduct.name}</TableCell>
										<TableCell align='center'>
											${searchedProduct.price}
										</TableCell>
										<TableCell align='center'>
											{searchedProduct.description}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}
			</Box>

			<Box mb={2}>
				<Typography variant='h6' gutterBottom>
					Search for an Order by ID
				</Typography>
				<TextField
					label='Order ID'
					variant='outlined'
					value={searchOrderId}
					onChange={(e) => setSearchOrderId(e.target.value)}
					fullWidth
				/>
				<Button
					sx={{ marginTop: '20px', width: '100%' }}
					variant='contained'
					color='primary'
					onClick={handleSearchOrder} // use the new search function
				>
					Search
				</Button>
				{searchedOrder && (
					<Box mt={3}>
						<Typography variant='h6' gutterBottom>
							Order Found:
						</Typography>
						<TableContainer component={Paper}>
							<Table aria-label='simple table'>
								<TableHead>
									<TableRow>
										<TableCell align='center'>Order ID</TableCell>
										<TableCell align='center'>Product Name</TableCell>
										<TableCell align='center'>Customer Name</TableCell>
										<TableCell align='center'>Status</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell component='th' scope='row' align='center'>
											{searchedOrder.id}
										</TableCell>
										<TableCell align='center'>
											{searchedOrder.product_name}
										</TableCell>
										<TableCell align='center'>
											{searchedOrder.customer_name}
										</TableCell>
										<TableCell align='center'>
											{searchedOrder.status}
											{searchedOrder.status === 'Shipped' && (
												<FontAwesomeIcon
													icon={faCheckCircle}
													style={{ color: 'green', marginLeft: '5px' }}
												/>
											)}
											{searchedOrder.status === 'Processing' && (
												<FontAwesomeIcon
													icon={faSpinner}
													spin
													style={{ color: 'blue', marginLeft: '5px' }}
												/>
											)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}
			</Box>
			<SalesHistory></SalesHistory>
		</Grid>
	);
};

export default VendorDashboard;
