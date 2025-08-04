const storeServices = require('../services/store-services');
const { verifyToken } = require('../utils/verifyToken'); 



/////////// Product Controllers ///////////
const createProduct = async (req, res) => {
  /*
    #swagger.tags = ['Products']
    #swagger.summary = 'Create a new product'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        title: "string",
        description: "string",
        thumbnail: "string",
        images: ["string"],
        category: "string",
        price: 100.00
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  // const decoded = verifyToken(accessToken)
  // console.log("Create product token " , decoded.role)
  const productData = req.body;
  if (!productData) return res.status(401).json({ error: 'Product data missing' });
  const result = await storeServices.createProduct(accessToken, productData);
  return res.status(result.success ? 201 : 400).json(result);
};


/////////// Get All Products ///////////////
const getAllProducts = async (req, res) => {
  /*
    #swagger.tags = ['Products']
    #swagger.summary = 'Get all products'
  */
  const result = await storeServices.getAllProducts();
  return res.status(result.success ? 200 : 503).json(result);
};


/////////// Get Product By Id ///////////////////
const getProductById = async (req, res) => {
  /*
    #swagger.tags = ['Products']
    #swagger.summary = 'Get product by ID'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        productId: "string"
      }
    }
  */
  const { productId } = req.body;
  if (!productId) return res.status(401).json({ error: 'Product id missing' });
  const result = await storeServices.getProductById(productId);
  return res.status(result.success ? 200 : 404).json(result);
};


/////////// Update Product /////////////////
const updateProduct = async (req, res) => {
  /*
    #swagger.tags = ['Products']
    #swagger.summary = 'Update a product'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        productId: "string",
        title: "string",
        description: "string",
        thumbnail: "string",
        images: ["string"],
        category: "string",
        price: 100.00
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const { productId, ...updateData } = req.body;
  if (!productId || Object.keys(updateData).length === 0) return res.status(401).json({ error: 'All fields required' });

  const result = await storeServices.updateProduct(accessToken, productId, updateData);
  return res.status(result.success ? 200 : 400).json(result);
};


///////// Delete Product //////////////////
const deleteProduct = async (req, res) => {
  /*
    #swagger.tags = ['Products']
    #swagger.summary = 'Delete a product'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        productId: "string"
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const { productId } = req.body;
  if (!productId) return res.status(401).json({ error: 'Product id missing' });


  const result = await storeServices.deleteProduct(accessToken, productId);
  return res.status(result.success ? 200 : 400).json(result);
};


/////////// Add Item to Cart ///////////
const addItemToCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Add item to cart'
    #swagger.description = 'Add a product to the user\'s or guest cart. Requires either accessToken (for logged-in users) or cartId (for guests).'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        productId: "string",
        quantity: 1,
        cartId: "string (optional for guests)"
      }
    }
  */

  try {
    const { productId, quantity = 1, cartId = null } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product ID and valid quantity are required' });
    }

    const result = await storeServices.addItemToCart({
      productId,
      quantity,
      cartId
    });

    return res.status(result.status).json(result);
  } catch (err) {
    console.error('[addItemToCart Controller Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


///////// Assign user to cart ////////////
const assignGuestCartToUser = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Assign guest cart to logged-in user'
    #swagger.description = 'Merge or assign guest cart items to the user\'s cart after login'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        cartId: 'string'
      }
    }
  */
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
    const {cartId } = req.body;
    if (!cartId){return res.status(400).json({ success: false, message: 'userId and cartId are required' });}
    const result = await storeServices.assignGuestCartToUser({ accessToken, cartId });
    return res.status(result.status).json(result);
  } catch (err) {
    console.error('[assignGuestCartToUserController Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


/////// Get Cart ////////////////////////
const getCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Get cart'
    #swagger.description = 'Retrieve all cart items for logged-in or guest user'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: false,
      type: 'string',
      description: 'Bearer accessToken (for logged-in users)'
    }
    #swagger.parameters['cartId'] = {
      in: 'query',
      required: false,
      type: 'string',
      description: 'Cart ID (for guest users)'
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1] || null;
  const cartId = req.query.cartId || null;

  const result = await storeServices.getCart({ accessToken, cartId });
  return res.status(result.status).json(result);
};


////////// Remove Item From Cart ////////////////
const removeItemFromCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Remove item from cart'
    #swagger.description = 'Remove a specific product from the cart (logged-in or guest)'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: false,
      type: 'string',
      description: 'Bearer accessToken (for logged-in users)'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        productId: 'string',
        cartId: 'string (optional for guest users)'
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1] || null;
  const { productId, cartId = null } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required' });
  }

  const result = await storeServices.removeItemFromCart({ accessToken, cartId, productId });
  return res.status(result.status).json(result);
};



////////// Clear Cart ///////////////////
const clearCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Clear cart'
    #swagger.description = 'Remove all items from the cart (logged-in or guest)'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: false,
      type: 'string',
      description: 'Bearer accessToken (for logged-in users)'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: false,
      schema: {
        cartId: 'string (optional for guest users)'
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1] || null;
  const { cartId = null } = req.body;

  const result = await storeServices.clearCart({ accessToken, cartId });
  return res.status(result.status).json(result);
};



////////////////// Make Order ////////////////////////////////
const makeOrder = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Get user cart'
    #swagger.description = 'Retrieve all cart items for the logged-in user'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        cartId: 'string'
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const { cartId } = req.body;
  if (!cartId) return res.status(401).json({ error: 'Cart id missing' });
  const result = await storeServices.makeOrder(accessToken, cartId);

  return res.status(result.success ? 200 : 400).json(result);
};


////////////////// Get My Order ////////////////////////////////
const getMyOrders = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Get user cart'
    #swagger.description = 'Retrieve all cart items for the logged-in user'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const result = await storeServices.getMyOrders(accessToken);

  return res.status(result.success ? 200 : 400).json(result);
};


///////// Guest order OTP /////////////////////////
const requestOtp = async (req, res) => {
    /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Guest Order OTP'
    #swagger.description = 'Guest Order OTP'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        phoneNumber: 'string'
      }
    }
  */
  try {
    const { phoneNumber } = req.body;

    const result = await requestGuestOtp(phoneNumber);

    res.status(result.status).json(result);
  } catch (error) {
    console.error('[requestOtpController Error]', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};


////// Verify Guest Order ////////////////////////////
const verifyOrder = async (req, res) => {
    /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Verify Guest Order'
    #swagger.description = 'Verify Guest Order'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        phoneNumber: " ",
        otp: : " ",
        cartId: " ",
        action: " "
      }
    }
  */
  try {
    const { phoneNumber, otp, cartId, action } = req.body;

    const result = await verifyGuestOrder({ phoneNumber, otp, cartId, action });

    res.status(result.status).json(result);
  } catch (error) {
    console.error('[verifyOrderController Error]', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};





module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addItemToCart,
  getCart,
  clearCart,
  removeItemFromCart,
  makeOrder,
  getMyOrders,
  assignGuestCartToUser,
  requestOtp,
  verifyOrder,
};
