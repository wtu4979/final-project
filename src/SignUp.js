import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const Signup = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [userType, setUserType] = useState('customer');
	const [vendorName, setVendorName] = useState('');
	const [open, setOpen] = useState(false);

	const handleClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}
		setOpen(false);
	};

	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const response = await axios.post('http://127.0.0.1:5000/signup', {
				username,
				password,
				userType,
				vendorName: userType === 'vendor' ? vendorName : undefined,
			});

			if (response.status === 201) {
				console.log('User created');
				setOpen(true); // Open the Snackbar when the user is created
				// Redirect to login or homepage after a delay
				setTimeout(() => {
					navigate('/login');
				}, 1000);
			}
		} catch (error) {
			console.error('Error during registration:', error);
		}
	};

	return (
		<Grid
			container
			direction='column'
			justifyContent='center'
			alignItems='center'
			style={{ minHeight: '50vh' }}
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
					Sign up
				</Typography>
				<form onSubmit={handleSubmit}>
					<Box mb={2}>
						<TextField
							label='Username'
							variant='outlined'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							fullWidth
							sx={{
								'& .MuiInputBase-root': {
									height: '3rem',
								},
							}}
						/>
					</Box>
					<Box mb={2}>
						<TextField
							label='Password'
							type='password'
							variant='outlined'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							fullWidth
							sx={{
								'& .MuiInputBase-root': {
									height: '3rem',
								},
							}}
						/>
					</Box>

					<Box mb={2}>
						<FormControl fullWidth variant='outlined'>
							<InputLabel>User type</InputLabel>
							<Select
								value={userType}
								onChange={(e) => setUserType(e.target.value)}
								label='User type'
							>
								<MenuItem value='customer'>Customer</MenuItem>
								<MenuItem value='vendor'>Vendor</MenuItem>
							</Select>
						</FormControl>
					</Box>
					<Box
						mb={2}
						style={{ display: userType === 'vendor' ? 'block' : 'none' }}
					>
						<TextField
							label='Vendor Name'
							variant='outlined'
							value={vendorName}
							onChange={(e) => setVendorName(e.target.value)}
							fullWidth
							sx={{
								'& .MuiInputBase-root': {
									height: '3rem',
								},
							}}
						/>
					</Box>
					<Button
						type='submit'
						variant='contained'
						color='primary'
						disabled={userType === 'vendor' && vendorName === ''}
						sx={{
							fontSize: '1.2rem',
							height: '3rem',
							width: '100%',
						}}
					>
						Submit
					</Button>
				</form>
			</Grid>
			<Snackbar
				open={open}
				autoHideDuration={2000}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Alert onClose={handleClose} severity='success' sx={{ width: '100%' }}>
					User created successfully!
				</Alert>
			</Snackbar>
		</Grid>
	);
};

export default Signup;
