import './App.css';
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Switch,
	Link,
} from 'react-router-dom';
import Homepage from './Homepage';
import SignUp from './SignUp';
import Login from './Login';
import VendorDashboard from './VendorDashboard';

function App() {
	return (
		<Router>
			<div className='App'>
				{/* Navigation menu */}
				<nav>
					<ul>
						<li>
							<Link to='/'>Home</Link>
						</li>
						<li>
							<Link to='/signup'>Sign Up</Link>
						</li>
						<li>
							<Link to='/login'>Login</Link>
						</li>
						<li>
							<Link to='/vendor-dashboard'>Vendor Dashboard</Link>
						</li>
					</ul>
				</nav>

				<div className='productHome'>
					<h1>Product Home</h1>
				</div>

				<Routes>
					<Route path='/' element={<Homepage />} />
					<Route path='/signup' element={<SignUp />} />
					<Route path='/login' element={<Login />} />
					<Route path='/vendor-dashboard' element={<VendorDashboard />} />

					{/* Add other routes here */}
				</Routes>
			</div>
		</Router>
	);
}

export default App;
