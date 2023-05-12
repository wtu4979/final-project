// src/OrderHistory.js
import React, { useState, useEffect } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const OrderHistory = () => {
	const [orders, setOrders] = useState([]);

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				const response = await fetch('http://127.0.0.1:5000/get_orders', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${localStorage.getItem('access_token')}`,
					},
				});
				const data = await response.json();

				setOrders(data.orders);
			} catch (error) {
				console.error('Error fetching order history:', error);
			}
		};

		fetchOrders();
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
				Order History
			</Typography>
			<TableContainer component={Paper} style={{ maxWidth: '100%' }}>
				<Table sx={{ minWidth: 650 }} aria-label='simple table'>
					<TableHead>
						<TableRow>
							<TableCell align='left'>Product Name</TableCell>
							<TableCell align='center'>Quantity Purchased</TableCell>
							<TableCell align='center'>Purchase Price</TableCell>
							<TableCell align='right'>Vendor</TableCell>
							<TableCell align='center'>Current Status</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{orders.map((order, index) => (
							<TableRow
								key={order.product_id + index}
								sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
							>
								<TableCell align='left' component='th' scope='row'>
									{order.product_name}
								</TableCell>
								<TableCell align='center'>{order.quantity}</TableCell>
								<TableCell align='center'>${order.total_price}</TableCell>
								<TableCell align='right'>{order.vendor_name}</TableCell>
								<TableCell align='center'>
									{order.status}
									{order.status === 'Shipped' && (
										<FontAwesomeIcon
											icon={faCheckCircle}
											style={{ color: 'green', marginLeft: '5px' }}
										/>
									)}
									{order.status === 'Processing' && (
										<FontAwesomeIcon
											icon={faSpinner}
											spin
											style={{ color: 'blue', marginLeft: '5px' }}
										/>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>{' '}
		</Box>
	);
};

export default OrderHistory;
