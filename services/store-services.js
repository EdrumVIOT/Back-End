const Product = require('../models/product-model');
const Cart = require('../models/cart-model');
const { verifyToken } = require('../utils/verifyToken');


//////////////////// Create Product ////////////////////
const createProduct = async (accessToken, productData) => {
  try {
    if (!accessToken) {
      return { success: false, status: 401, message: 'Access token is required' };
    }

    const decoded = verifyToken(accessToken);
    const ownerId = decoded.userId;
    const role = decoded.role;

    if (!['admin'].includes(role)) {
      return { success: false, status: 403, message: 'Unauthorized. Only store or admin can create products.' };
    }

    const { title, description, thumbnail, images, category, price } = productData;

    if (!title || !description || !category || !price) {
      return { success: false, status: 400, message: 'Missing required fields' };
    }

    const newProduct = await Product.create({
      ownerId,
      title,
      description,
      thumbnail,
      images,
      category,
      price,
      createdAt: new Date()
    });

    return {
      success: true,
      status: 201,
      message: 'Product created successfully',
      data: newProduct
    };
  } catch (err) {
    console.error('[createProduct Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////////////// Get All Products ////////////////////
const getAllProducts = async () => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return { success: true, status: 200, data: products };
  } catch (err) {
    console.error('[getAllProducts Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////////////// Get Product by ID ////////////////////
const getProductById = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return { success: false, status: 404, message: 'Product not found' };
    return { success: true, status: 200, data: product };
  } catch (err) {
    console.error('[getProductById Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////////////// Update Product ////////////////////
const updateProduct = async (accessToken, productId, updateData) => {
  try {
    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;
    const role = decoded.role;

    if (!['admin'].includes(role)) {
      return { success: false, status: 403, message: 'Unauthorized. Only store or admin can update products.' };
    }

    const query = role === 'admin'
      ? { _id: productId }
      : { _id: productId, ownerId: userId };

    const product = await Product.findOne(query);
    if (!product) return { success: false, status: 404, message: 'Product not found or unauthorized' };

    Object.assign(product, updateData);
    await product.save();

    return { success: true, status: 200, data: product };
  } catch (err) {
    console.error('[updateProduct Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////////////// Delete Product ////////////////////
const deleteProduct = async (accessToken, productId) => {
  try {
    const decoded = verifyToken(accessToken);
    const { userId, role } = decoded;

    if (!['admin'].includes(role)) {
      return { success: false, status: 403, message: 'Unauthorized. Only store or admin can delete products.' };
    }

    const query = role === 'admin'
      ? { _id: productId }
      : { _id: productId, ownerId: userId };

    const deleted = await Product.findOneAndDelete(query);
    if (!deleted) return { success: false, status: 404, message: 'Product not found or unauthorized' };

    return { success: true, status: 200, message: 'Product deleted successfully' };
  } catch (err) {
    console.error('[deleteProduct Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////// Add item to Cart ///////////////////////////
const addItemToCart = async (accessToken, productId, quantity = 1) => {
  try {
    if (!accessToken) return { success: false, status: 401, message: 'Access token is required' };

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    const product = await Product.findById(productId);
    if (!product) return { success: false, status: 404, message: 'Product not found' };

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity }]
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    cart.updatedAt = new Date();
    await cart.save();

    return {
      success: true,
      status: 200,
      message: 'Product added to cart',
      data: cart
    };
  } catch (err) {
    console.error('[addProductToCart Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


////////// Get Cart //////////////////////////////
const getCart = async (accessToken) => {
  try {
    if (!accessToken) return { success: false, status: 401, message: 'Access token is required' };

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      return { success: true, status: 200, message: 'Cart is empty', data: [] };
    }

    return { success: true, status: 200, data: cart };
  } catch (err) {
    console.error('[getCart Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////////////// Remove Item from Cart ////////////////////
const removeItemFromCart = async (accessToken, productId) => {
  try {
    if (!accessToken) return { success: false, status: 401, message: 'Access token is required' };

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    const cart = await Cart.findOne({ userId });
    if (!cart) return { success: false, status: 404, message: 'Cart not found' };

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (cart.items.length === originalLength) {
      return { success: false, status: 404, message: 'Product not found in cart' };
    }

    cart.updatedAt = new Date();
    await cart.save();

    return {
      success: true,
      status: 200,
      message: 'Product removed from cart',
      data: cart
    };
  } catch (err) {
    console.error('[removeItemFromCart Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


//////////////////// Clear Cart ////////////////////
const clearCart = async (accessToken) => {
  try {
    if (!accessToken) return { success: false, status: 401, message: 'Access token is required' };

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    const cart = await Cart.findOne({ userId });
    if (!cart) return { success: false, status: 404, message: 'Cart not found' };

    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();

    return {
      success: true,
      status: 200,
      message: 'Cart cleared successfully',
      data: cart
    };
  } catch (err) {
    console.error('[clearCart Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};



module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addItemToCart,
  removeItemFromCart,
  clearCart,
  getCart
};
