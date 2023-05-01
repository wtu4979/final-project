import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
	const navigate = useNavigate();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();

		const response = await fetch('http://localhost:5000/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		});

		if (response.ok) {
			const data = await response.json();
			console.log('Access Token:', data.access_token);
			// You can save the access token to localStorage or in your app state
			navigate('/');
		} else {
			console.error('Invalid login');
		}
	};

	return (
		<div>
			<h2>Login</h2>
			<form onSubmit={handleSubmit}>
				<div>
					<label>Username:</label>
					<input
						type='text'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
				</div>
				<div>
					<label>Password:</label>
					<input
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<button type='submit'>Login</button>
			</form>
		</div>
	);
};

export default Login;
