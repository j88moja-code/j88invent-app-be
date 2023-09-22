const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");

////////////////////////////////////////////////////////////////////////////////////////////////

// Create product
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  // Validate the product
  if (!name || !sku || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in the required fields");
  }

  // Handle image uploads
  let fileData = {};
  if (req.file) {
    //Save image to Cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "MERN_app_data",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }
    fileData = {
      filename: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create the product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Get all products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Get one product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // If the product does not exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match the product to the user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not allowed to view this product");
  }
  res.status(200).json(product);
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // If the product does not exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match the product to the user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not allowed to delete this product");
  }
  await product.deleteOne();
  res.status(200).json({
    message: "Product deleted.",
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Update a product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // If the product does not exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match the product to the user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not allowed to edit this product");
  }

  // Handle image uploads
  let fileData = {};
  if (req.file) {
    //Save image to Cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "MERN_app_data",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }
    fileData = {
      filename: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update the product
  const updateProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updateProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
