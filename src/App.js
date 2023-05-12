import './App.css';
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Switch,
	Link,
	useNavigate,
} from 'react-router-dom';
import Homepage from './Homepage';
import SignUp from './SignUp';
import Login from './Login';
import VendorDashboard from './VendorDashboard';
import Checkout from './Checkout';
import OrderHistory from './OrderHistory';

import React, { useState, useEffect } from 'react';

// Material UI components
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

function App() {
	const [loggedIn, setIsLoggedIn] = useState(false);
	const [userType, setUserType] = useState('');
	const [cartItemCount, setCartItemCount] = useState(0);

	const resetCartItemCount = () => setCartItemCount(0);

	const handleLoginState = (state, type) => {
		setIsLoggedIn(state);
		setUserType(type);
	};

	const handleLogout = () => {
		localStorage.removeItem('access_token');
		setIsLoggedIn(false);
		setCartItemCount(0);
	};

	useEffect(() => {
		if (loggedIn) {
			const token = localStorage.getItem('access_token');
			fetch('http://127.0.0.1:5000/api/shopping_cart', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
				.then((response) => response.json())
				.then((data) => {
					const totalQuantity = data.cart.reduce(
						(sum, item) => sum + item.quantity,
						0
					);
					setCartItemCount(totalQuantity);
				})
				.catch((error) => {
					console.error('Error fetching cart:', error);
				});
		}
	}, [loggedIn]);

	return (
		<Router>
			<div className='App'>
				<AppBar position='static'>
					<Toolbar>
						<Button color='inherit'>
							<Link to='/' className='nav-link'>
								Home
							</Link>
						</Button>
						{loggedIn ? (
							<Button color='inherit' onClick={() => handleLogout()}>
								Logout
							</Button>
						) : (
							<>
								<Button color='inherit'>
									<Link to='/signup' className='nav-link'>
										Sign Up
									</Link>
								</Button>
								<Button color='inherit'>
									<Link to='/login' className='nav-link'>
										Login
									</Link>
								</Button>
							</>
						)}
						{loggedIn && userType === 'vendor' && (
							<Button color='inherit'>
								<Link to='/vendor-dashboard' className='nav-link'>
									Vendor Dashboard
								</Link>
							</Button>
						)}
						{loggedIn && userType === 'customer' && (
							<Button color='inherit'>
								<Link to='/order-history' className='nav-link'>
									Order History
								</Link>
							</Button>
						)}
						<Badge color='error' badgeContent={cartItemCount}>
							{cartItemCount > 0 ? (
								<Link to='/checkout' className='nav-link'>
									<ShoppingCartIcon />
								</Link>
							) : (
								<div className='nav-link'>
									<ShoppingCartIcon />
								</div>
							)}
						</Badge>
					</Toolbar>
				</AppBar>

				<Routes>
					<Route
						path='/'
						element={<Homepage onAddToCart={setCartItemCount} />}
					/>
					<Route path='/signup' element={<SignUp />} />
					<Route
						path='/login'
						element={
							<Login
								onLogin={(userType) => {
									handleLoginState(true, userType);
								}}
							/>
						}
					/>

					<Route path='/vendor-dashboard' element={<VendorDashboard />} />
					<Route
						path='/checkout'
						element={<Checkout onPlaceOrder={resetCartItemCount} />}
					/>

					<Route path='/order-history' element={<OrderHistory />} />

					{/* Add other routes here */}
				</Routes>
			</div>
		</Router>
	);
}

export default App;
