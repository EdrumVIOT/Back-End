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


/////////// Cart Controllers ///////////
const addItemToCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Add item to cart'
    #swagger.description = 'Add a product to the user\'s cart'
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
        quantity: 1
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const { productId, quantity } = req.body;
  if (!productId || !quantity) return res.status(401).json({ error: 'All fields required' });
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  

  const result = await storeServices.addItemToCart(accessToken, productId, quantity);
  return res.status(result.success ? 200 : 400).json(result);
};


/////// Get Cart ////////////////////////
const getCart = async (req, res) => {
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
  const result = await storeServices.getCart(accessToken);

  return res.status(result.success ? 200 : 400).json(result);
};


////////// Remove Item From Cart ////////////////
const removeItemFromCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Remove item from cart'
    #swagger.description = 'Remove a specific product from the user\'s cart'
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
        productId: 'string'
      }
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const { productId } = req.body;
  if (!productId) return res.status(401).json({ error: 'Product id missing' });

  const result = await storeServices.removeItemFromCart(accessToken, productId);
  return res.status(result.success ? 200 : 400).json(result);
};


////////// Clear Cart ///////////////////
const clearCart = async (req, res) => {
  /*
    #swagger.tags = ['Cart']
    #swagger.summary = 'Clear user cart'
    #swagger.description = 'Remove all items from the user\'s cart'
    #swagger.parameters['Authorization'] = {
      in: 'header',
      required: true,
      type: 'string',
      description: 'Bearer accessToken'
    }
  */
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) return res.status(401).json({ error: 'Access token missing' });
  const result = await storeServices.clearCart(accessToken);
  return res.status(result.success ? 200 : 400).json(result);
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
};
