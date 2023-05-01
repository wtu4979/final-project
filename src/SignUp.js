import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [userType, setUserType] = useState('customer');

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const response = await axios.post('http://localhost:5000/signup', {
				username,
				password,
				userType,
			});

			if (response.status === 201) {
				console.log('User created');
				// Redirect to login or homepage
			}
		} catch (error) {
			console.error('Error during registration:', error);
		}
	};

	return (
		<div>
			<h1>Sign up</h1>
			<form onSubmit={handleSubmit}>
				<label>
					Username:
					<input
						type='text'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Password:
					<input
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</label>
				<br />
				<label>
					User type:
					<select
						value={userType}
						onChange={(e) => setUserType(e.target.value)}
					>
						<option value='customer'>Customer</option>
						<option value='vendor'>Vendor</option>
					</select>
				</label>
				<br />
				<button type='submit'>Submit</button>
			</form>
		</div>
	);
};

export default Signup;
