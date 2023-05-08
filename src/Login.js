import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

const Login = (props) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Access Token:", data.access_token);
      // Save the access token to localStorage
      localStorage.setItem("access_token", data.access_token);
      if (data.user_type === "vendor") {
        navigate("/vendor-dashboard");
      } else {
        navigate("/");
      }
      props.onLogin(data.user_type);
    } else {
      console.error("Invalid login");
    }
  };

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      style={{ minHeight: "50vh" }}
    >
      <Grid
        item
        xs={12}
        sm={8}
        md={8}
        lg={8}
        style={{ width: "80%", maxWidth: "500px" }}
      >
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box mb={2}>
            <TextField
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  height: "3rem",
                },
              }}
            />
          </Box>
          <Box mb={2}>
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              sx={{
                "& .MuiInputBase-root": {
                  height: "3rem",
                },
              }}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              fontSize: "1.2rem",
              height: "3rem",
              width: "100%",
            }}
          >
            Login
          </Button>
        </form>
      </Grid>
    </Grid>
  );
};

export default Login;
