const storeServices = require('../services/store-services');


///////  Create Product //////////////////////////////
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
  const productData = req.body;

  const result = await storeServices.createProduct(accessToken, productData);
  res.status(result.success ? 201 : 400).json(result);
};

//////////////  Get All Products ////////////////////////
const getAllProducts = async (req, res) => {
  /*
    #swagger.tags = ['Products']
    #swagger.summary = 'Get all products'
  */
  const result = await storeServices.getAllProducts();
  res.status(result.success ? 200 : 500).json(result);
};

///////////////////  Get Product by ID ////////////////////
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

  const result = await storeServices.getProductById(productId);
  res.status(result.success ? 200 : 404).json(result);
};

//////// Update Product ////////////////////////////////
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
  const { productId, ...updateData } = req.body;

  const result = await storeServices.updateProduct(accessToken, productId, updateData);
  res.status(result.success ? 200 : 400).json(result);
};

///////  Delete Product //////////////////////////////////////////
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
  const { productId } = req.body;

  const result = await storeServices.deleteProduct(accessToken, productId);
  res.status(result.success ? 200 : 400).json(result);
};

//////////// Add Item to Cart //////////////////////////////////////////////
const addItemToCart = async (req, res) => {
  try {
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
    const { productId, quantity } = req.body;
    const result = await storeServices.addItemToCart(accessToken, productId, quantity);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


//////////////////// Get Cart ////////////////////
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

  const result = await storeServices.getCart(accessToken);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(200).json(result);
};

//////////////////// Remove Item from Cart ////////////////////
const removeItemFromCart= async (req, res) => {
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
  const { productId } = req.body;

  const result = await storeServices.removeItemFromCart(accessToken, productId);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(200).json(result);
};

//////////////////// Clear Cart ////////////////////
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

  const result = await storeServices.clearCart(accessToken);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(200).json(result);
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
  removeItemFromCart
};
