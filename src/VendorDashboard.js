// src/VendorDashboard.js
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";

const VendorDashboard = () => {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("price", productPrice);
    formData.append("description", productDescription);
    if (productImage) {
      formData.append("image", productImage);
    }

    console.log(formData);

    const response = await fetch("http://127.0.0.1:5000/create-product", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    });

    if (response.ok) {
      // Reset form fields after successful submission
      setProductName("");
      setProductPrice("");
      setProductDescription("");
      setProductImage(null);
      console.log("Product created");
    } else {
      console.error("Error creating product");
    }
  };

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      style={{ minHeight: "50vh" }}
      mt={5}
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
          Vendor Dashboard
        </Typography>
        <Typography variant="h6" gutterBottom>
          Create New Product
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box mb={2}>
            <TextField
              label="Name"
              variant="outlined"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              fullWidth
            />
          </Box>
          <Box mb={2}>
            <TextField
              label="Price"
              type="number"
              step="0.01"
              variant="outlined"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              fullWidth
            />
          </Box>
          <Box mb={2}>
            <TextField
              label="Description"
              variant="outlined"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
          </Box>
          <Button type="submit" variant="contained" color="primary">
            Create Product
          </Button>
        </form>
      </Grid>
    </Grid>
  );
};

export default VendorDashboard;
