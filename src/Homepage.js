import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { IconButton } from '@mui/material';
import AddShoppingCart from '@mui/icons-material/AddShoppingCart';
import { Snackbar } from '@mui/material';
import Alert from '@mui/material/Alert';

function Homepage({ onAddToCart }) {
	const [products, setProducts] = useState([]);
	const [snackbarOpen, setSnackbarOpen] = useState(false);

	const handleCloseSnackbar = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}
		setSnackbarOpen(false);
	};

	useEffect(() => {
		fetch('http://127.0.0.1:5000/products')
			.then((response) => response.json())
			.then((data) => setProducts(data.products))
			.catch((error) => {
				console.error('Error fetching products:', error);
			});
	}, []);

	const addToCart = (product) => {
		const token = localStorage.getItem('access_token');
		fetch('http://127.0.0.1:5000/add-to-cart', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				productId: product.id,
				quantity: 1, // Change this if you want to add more than 1 quantity
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log(`Product ${product.id} added to cart`);
				handleAddToCart();
				setSnackbarOpen(true);
			})
			.catch((error) => {
				console.error('Error adding product to cart:', error);
			});
	};

	const handleAddToCart = () => {
		onAddToCart((prevCount) => prevCount + 1);
	};

	return (
		<div>
			<Snackbar
				open={snackbarOpen}
				autoHideDuration={3000}
				onClose={handleCloseSnackbar}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity='success'
					sx={{ width: '100%' }}
				>
					Item added to cart!
				</Alert>
			</Snackbar>
			<Grid container spacing={3}>
				{products.length ? (
					products.map((product) => (
						<Grid item key={product.id} xs={12} sm={6} md={4}>
							<Card>
								<CardContent>
									<Typography variant='h5' component='div'>
										{product.name}
									</Typography>
									<Typography variant='body2' color='text.secondary'>
										{product.description}
									</Typography>
									<Typography variant='subtitle1' color='text.primary'>
										${product.price}
									</Typography>
									<Typography variant='subtitle1' color='text.primary'>
										Sold by: {product.vendor_name}
									</Typography>
									<IconButton
										color='primary'
										onClick={() => addToCart(product)}
										aria-label='Add to cart'
									>
										<AddShoppingCart />
									</IconButton>
								</CardContent>
							</Card>
						</Grid>
					))
				) : (
					<Grid
						container
						spacing={0}
						direction='column'
						alignItems='center'
						justify='center'
						style={{ minHeight: '100vh' }}
						mt={10}
					>
						<Grid item xs={3}>
							<Alert severity='info' variant='filled'>
								There are no products for sale, please check again later!
							</Alert>
						</Grid>
					</Grid>
				)}
			</Grid>
		</div>
	);
}

export default Homepage;
