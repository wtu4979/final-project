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

const SalesHistory = () => {
	const [sales, setSales] = useState([]);

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
				Sold History
			</Typography>
			<TableContainer component={Paper} style={{ maxWidth: '100%' }}>
				<Table sx={{ minWidth: 650 }} aria-label='simple table'>
					<TableHead>
						<TableRow>
							<TableCell align='left'>Product Name</TableCell>
							<TableCell align='center'>Quantity Sold</TableCell>
							<TableCell align='right'>Customer</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sales.map((sale, index) => (
							<TableRow
								key={sale.product_id + index}
								sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
							>
								<TableCell align='left' component='th' scope='row'>
									{sale.product_name}
								</TableCell>
								<TableCell align='center'>{sale.quantity}</TableCell>
								<TableCell align='right'>{sale.customer_name}</TableCell>
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
			<SalesHistory></SalesHistory>
		</Grid>
	);
};

export default VendorDashboard;
