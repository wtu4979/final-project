import React, { useState, useEffect, useCallback } from 'react';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import InputLabel from '@mui/material/InputLabel';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/Dialog';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
} from '@mui/material';

const ProductsForSale = () => {
	const [products, setProducts] = useState([]);
	const [open, setOpen] = useState(false);
	const [currentProduct, setCurrentProduct] = useState(null);

	const fetchProducts = useCallback(async () => {
		try {
			const response = await fetch('http://127.0.0.1:5000/get_products', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('access_token')}`,
				},
			});
			const data = await response.json();

			setProducts(data.products);
		} catch (error) {
			console.error('Error fetching products:', error);
		}
	}, []);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	const handleOpen = (product) => {
		setCurrentProduct(product);
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleSubmit = async () => {
		const productData = {
			id: currentProduct.id, // use currentProduct.id
			name: currentProduct.name, // use currentProduct.name
			price: currentProduct.price, // use currentProduct.price
			description: currentProduct.description, // use currentProduct.description
		};

		const response = await fetch(
			`http://localhost:5000/update-product/${productData.id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('access_token')}`, // use the saved token
				},
				body: JSON.stringify(productData),
			}
		);

		const responseData = await response.json();

		if (!response.ok) {
			console.error(responseData);
			return;
		}

		fetchProducts();

		handleClose();
	};

	const handleDelete = async (id) => {
		try {
			const response = await fetch(
				`http://localhost:5000/delete-product/${id}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('access_token')}`, // use the saved token
					},
				}
			);

			if (!response.ok) {
				// Handle error
				const responseData = await response.json();
				console.error(responseData);
				return;
			}

			// Refetch the products
			fetchProducts();
		} catch (error) {
			console.error('Error deleting product:', error);
		}
	};

	return (
		<>
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
					Products for Sale
				</Typography>
				<TableContainer component={Paper} style={{ maxWidth: '100%' }}>
					<Table sx={{ minWidth: 650 }} aria-label='simple table'>
						<TableHead>
							<TableRow>
								<TableCell>Product ID</TableCell>
								<TableCell align='left'>Product Name</TableCell>
								<TableCell align='center'>Price</TableCell>
								<TableCell align='center'>Description</TableCell>
								<TableCell align='center'>Edit Product</TableCell>
								<TableCell align='center'>Delete Product</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{products.map((product, index) => (
								<TableRow
									key={product.id + index}
									sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
								>
									<TableCell>{product.id}</TableCell>
									<TableCell align='left' component='th' scope='row'>
										{product.name}
									</TableCell>
									<TableCell align='center'>${product.price}</TableCell>
									<TableCell align='center'>{product.description}</TableCell>
									<TableCell align='center'>
										<Button color='primary' onClick={() => handleOpen(product)}>
											Edit
										</Button>
									</TableCell>
									<TableCell align='center'>
										<Button
											color='error'
											onClick={() => handleDelete(product.id)}
										>
											<FontAwesomeIcon icon={faTrash} />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>

			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Edit Product</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Please edit the information below:
					</DialogContentText>
					<TextField
						autoFocus
						margin='dense'
						id='name'
						label='Product Name'
						type='text'
						fullWidth
						value={currentProduct ? currentProduct.name : ''}
						onChange={(e) =>
							setCurrentProduct({ ...currentProduct, name: e.target.value })
						}
					/>
					<TextField
						margin='dense'
						id='price'
						label='Price'
						type='number'
						fullWidth
						value={currentProduct ? currentProduct.price : ''}
						onChange={(e) =>
							setCurrentProduct({ ...currentProduct, price: e.target.value })
						}
					/>
					<TextField
						margin='dense'
						id='description'
						label='Description'
						type='text'
						fullWidth
						value={currentProduct ? currentProduct.description : ''}
						onChange={(e) =>
							setCurrentProduct({
								...currentProduct,
								description: e.target.value,
							})
						}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={handleSubmit}>Update</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default ProductsForSale;
