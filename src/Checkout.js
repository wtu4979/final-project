import React, { useState, useEffect } from 'react';
import {
	Container,
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	CardActions,
	Grid,
} from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ onPlaceOrder }) => {
	const [cartItems, setCartItems] = useState([]);
	const [totalPrice, setTotalPrice] = useState(0);

	const navigate = useNavigate();

	const removeFromCart = (cartItemId) => {
		const itemToRemove = cartItems.find(
			(item) => item.cart_item_id === cartItemId
		);
		if (itemToRemove) {
			const token = localStorage.getItem('access_token');
			fetch(`http://127.0.0.1:5000/api/remove-from-cart`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ cartItemId }),
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.message === 'Item removed from cart') {
						setCartItems(
							cartItems.filter((item) => item.cart_item_id !== cartItemId)
						);
						// Update total price
						setTotalPrice(
							(prevTotal) =>
								prevTotal - itemToRemove.product_price * itemToRemove.quantity
						);
					}
				})
				.catch((error) => console.error('Error:', error));
		}
	};

	useEffect(() => {
		const token = localStorage.getItem('access_token');
		fetch(`http://127.0.0.1:5000/api/shopping_cart`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((data) => {
				// Consolidate cart items
				const consolidatedCartItems = data.cart.reduce((acc, item) => {
					const foundItem = acc.find(
						(accItem) =>
							accItem.product_name === item.product_name &&
							accItem.vendor_name === item.vendor_name
					);
					if (foundItem) {
						foundItem.quantity += item.quantity;
					} else {
						acc.push(item);
					}
					return acc;
				}, []);
				setCartItems(consolidatedCartItems);
				let total = 0;
				consolidatedCartItems.forEach((item) => {
					total += item.product_price * item.quantity;
				});
				setTotalPrice(total);
			})
			.catch((error) => console.error('Error:', error));
	}, []);

	return (
		<Container>
			<Box sx={{ my: 2 }}>
				<Typography variant='h4' component='h1' gutterBottom>
					Checkout Page
				</Typography>
				<Grid container spacing={3}>
					{cartItems.map((item, index) => (
						<Grid item xs={12} sm={6} md={4} key={item.cart_item_id + index}>
							<Card>
								<CardContent>
									<Typography variant='h5'>{item.product_name}</Typography>
									<Typography variant='hf'>{item.vendor_name}</Typography>
									<Typography variant='body2' color='text.secondary'>
										{item.product_description}
									</Typography>
									<Typography variant='body1'>${item.product_price}</Typography>
									<Typography variant='body1'>
										Quantity: {item.quantity}
									</Typography>
								</CardContent>
								<CardActions>
									<Button
										size='large'
										onClick={() => removeFromCart(item.cart_item_id)}
									>
										<FontAwesomeIcon icon={faTrash} />
									</Button>
								</CardActions>
							</Card>
						</Grid>
					))}
				</Grid>
				<Box mt={3}>
					<Typography variant='h5'>Total: ${totalPrice.toFixed(2)}</Typography>

					<Button
						variant='contained'
						color='primary'
						fullWidth
						onClick={() => {
							const token = localStorage.getItem('access_token');
							fetch('http://127.0.0.1:5000/place-order', {
								method: 'POST',
								headers: {
									Authorization: `Bearer ${token}`,
								},
							})
								.then((response) => response.json())
								.then((data) => {
									console.log(data);
									setCartItems([]);
									setTotalPrice(0);
									onPlaceOrder();
								})
								.catch((error) => console.error('Error:', error));

							navigate('/order-history');
						}}
					>
						Place Order
					</Button>
				</Box>
			</Box>
		</Container>
	);
};

export default Checkout;
