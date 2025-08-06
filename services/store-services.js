const Product = require('../models/product-model');
const Cart = require('../models/cart-model');
const Order = require('../models/order-model');
const Otp = require('../models/otp-model');
const { sendMessage } = require("../utils/messageSender");
const { verifyToken } = require('../utils/verifyToken');
const mongoose = require("mongoose");
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();


//////////////////// Create Product ////////////////////
const createProduct = async (accessToken, productData) => {
  try {
    if (!accessToken) {
      return { success: false, status: 401, message: 'Access token is required' };
    }

    const decoded = verifyToken(accessToken);
    const ownerId = decoded.userId;
    const role = decoded.role;
    console.log("Decoded ",decoded)

    if (role !== "admin") {
        return {
          success: false,
          status: 403,
          message: 'Unauthorized. Only admin can create products.'
        };
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

    if (role !== "admin") {
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
const addItemToCart = async ({ productId, quantity = 1, cartId = null }) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, status: 404, message: 'Product not found' };
    }

    let cart = null;
    if (cartId && mongoose.Types.ObjectId.isValid(cartId)) {
      cart = await Cart.findById(cartId);
    }

    if (!cart) {
      cart = new Cart({
        items: [{ productId, quantity }],
      });
    } else {
      if (!Array.isArray(cart.items)) cart.items = [];

      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId.toString()
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
      data: cart,
      cartId: cart._id,
    };
  } catch (err) {
    console.error('[addItemToCart Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};

/////////// Assign user to cart /////////////////
const assignGuestCartToUser = async ({ accessToken, cartId }) => {
  try {
    if (!accessToken || !cartId) {
      return { success: false, status: 400, message: 'accessToken and cartId are required' };
    }

    const decoded = verifyToken(accessToken);
    const { userId } = decoded;

    const guestCart = await Cart.findById(cartId);
    if (!guestCart) {
      return { success: false, status: 404, message: 'Guest cart not found' };
    }

    // Find user cart that is still active (not ordered)
    let userCart = await Cart.findOne({ userId, isOrdered: false });

    if (userCart) {
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find(
          (item) => item.productId.toString() === guestItem.productId.toString()
        );

        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          userCart.items.push(guestItem);
        }
      }

      userCart.updatedAt = new Date();
      await userCart.save();
      await Cart.findByIdAndDelete(cartId);

      return {
        success: true,
        status: 200,
        message: 'Guest cart merged into user cart',
        data: userCart
      };
    } else {
      guestCart.userId = userId;
      guestCart.isOrdered = false; 
      guestCart.updatedAt = new Date();
      await guestCart.save();

      return {
        success: true,
        status: 200,
        message: 'Guest cart assigned to user',
        data: guestCart
      };
    }
  } catch (err) {
    console.error('[assignGuestCartToUser Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


////////// Get Cart //////////////////////////////
const getCart = async ({ accessToken = null, cartId = null }) => {
  try {
    let userId = null;

      if (accessToken) {
        try {
          const decoded = verifyToken(accessToken);
          userId = Number(decoded.userId); // ✅ force number
        } catch (err) {
          console.warn('[getCart] Invalid access token:', err.message);
        }
      }

    let cart = null;

    if (userId) {
      cart = await Cart.findOne({ userId, isOrdered: false }).populate('items.productId');
    } else if (cartId) {
      if (!mongoose.Types.ObjectId.isValid(cartId)) {
        return {
          success: false,
          status: 400,
          message: 'Invalid cart ID format',
        };
      }

      cart = await Cart.findOne({ _id: cartId, isOrdered: false }).populate('items.productId');
    }

    if (!cart) {
      return {
        success: true,
        status: 200,
        message: 'Cart is empty or already ordered',
        data: [],
      };
    }

    return {
      success: true,
      status: 200,
      data: cart,
    };
  } catch (err) {
    console.error('[getCart Error]', err);
    return {
      success: false,
      status: 503,
      message: err.message,
    };
  }
};


//////////////////// Remove Item from Cart ////////////////////
const removeItemFromCart = async ({ accessToken = null, cartId = null, productId }) => {
  try {
    if (!productId) {
      return { success: false, status: 400, message: 'Product ID is required' };
    }

    let userId = null;
    if (accessToken) {
      try {
        const decoded = verifyToken(accessToken);
        userId = decoded.userId;
      } catch (err) {
        console.warn('[removeItemFromCart] Invalid token:', err.message);
      }
    }

    let cart = null;
    if (userId) {
      cart = await Cart.findOne({ userId });
    } else if (cartId) {
      cart = await Cart.findById(cartId);
    }

    if (!cart) {
      return { success: false, status: 404, message: 'Cart not found' };
    }

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
const clearCart = async ({ accessToken = null, cartId = null }) => {
  try {
    let userId = null;
    if (accessToken) {
      try {
        const decoded = verifyToken(accessToken);
        userId = decoded.userId;
      } catch (err) {
        console.warn('[clearCart] Invalid token:', err.message);
      }
    }

    let cart = null;
    if (userId) {
      cart = await Cart.findOne({ userId });
    } else if (cartId) {
      cart = await Cart.findById(cartId);
    }

    if (!cart) {
      return { success: false, status: 404, message: 'Cart not found' };
    }

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


////////////// Make Order ///////////////////////////////////
const createOrder = async (accessToken, cartId = null) => {
  try {
    if (!accessToken) {
      return { success: false, status: 401, message: 'Access token is required' };
    }

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;

    let cart;
    if (cartId) {
      cart = await Cart.findOne({ _id: cartId, userId, isOrdered: false }).populate('items.productId');
    } else {
      cart = await Cart.findOne({ userId, isOrdered: false }).populate('items.productId');
    }

    if (!cart || cart.items.length === 0) {
      return { success: false, status: 400, message: 'Cart is empty or already ordered' };
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.productId?.price || 0) * item.quantity;
    }, 0);

    const newOrder = await Order.create({
      cartId: cart._id,
      status: 'pending',
      totalAmount
    });

    cart.isOrdered = true;
    await cart.save();

    return {
      success: true,
      status: 200,
      message: 'Order created successfully',
      data: {
        orderId: newOrder._id,
        cartId: cart._id,
        totalAmount
      }
    };
  } catch (err) {
    console.error('[createOrder Error]', err);
    return { success: false, status: 503, message: err.message };
  }
};


/////////// Guest order req //////////////////////////////////////////
const requestGuestOtp = async (phoneNumber) => {
  if (!phoneNumber) throw new HttpError('Phone number is required.', 400);

  const existingOtp = await Otp.findOne({ number: phoneNumber }).sort({ createdAt: -1 });

  if (existingOtp && Date.now() - new Date(existingOtp.createdAt).getTime() < 60_000) {
    throw new HttpError('Please wait before requesting a new OTP.', 429);
  }

  await Otp.deleteMany({ number: phoneNumber });

  const otp = generateOtp();
  await Otp.create({ number: phoneNumber, otp });

  const messageSent = await sendMessage(phoneNumber, otp);
  if (!messageSent) throw new HttpError('Failed to send OTP.', 503);

  return {
    success: true,
    status: 200,
    message: 'OTP sent successfully to phone number',
  };
};


////////// Verify Order ///////////////////////////////////
const verifyGuestOrder = async ({ phoneNumber, otp, cartId, action }) => {
  if (!phoneNumber) {
    return { success: false, status: 400, message: 'Phone number is required' };
  }

  if (action === 'resend') {
    const existingOtp = await Otp.findOne({ number: phoneNumber }).sort({ createdAt: -1 });

    if (existingOtp && Date.now() - new Date(existingOtp.createdAt).getTime() < 60_000) {
      return { success: false, status: 429, message: 'Please wait before requesting a new OTP' };
    }

    await Otp.deleteMany({ number: phoneNumber });

    const newOtp = generateOtp();
    await Otp.create({ number: phoneNumber, otp: newOtp });

    const sent = await sendMessage(phoneNumber, newOtp);
    if (!sent) {
      return { success: false, status: 503, message: 'Failed to send OTP' };
    }

    return { success: true, status: 200, message: 'OTP resent successfully' };
  }

  if (action === 'verify') {
    if (!otp || !cartId) {
      return { success: false, status: 400, message: 'OTP and cartId are required' };
    }

    const record = await Otp.findOne({ number: phoneNumber, otp }).sort({ createdAt: -1 });

    if (!record) {
      return { success: false, status: 401, message: 'Invalid OTP' };
    }

    const isExpired = Date.now() - new Date(record.createdAt).getTime() > 60_000;
    if (isExpired) {
      await Otp.deleteMany({ number: phoneNumber });
      return { success: false, status: 403, message: 'OTP expired' };
    }

    const cart = await Cart.findById(cartId).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return { success: false, status: 400, message: 'Cart is empty or not found' };
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.productId?.price || 0) * item.quantity;
    }, 0);

    const newOrder = await Order.create({
      cartId,
      guest: true,
      phoneNumber,
      totalAmount,
      status: 'pending',
    });

    cart.isOrdered = true;
    await cart.save();

    await Otp.deleteMany({ number: phoneNumber });
    const messageSent = await sendMessage(phoneNumber, "Your order confirmed");
    

    return {
      success: true,
      status: 200,
      message: 'Guest order created successfully',
      data: {
        orderId: newOrder._id,
        totalAmount,
        messageSent,
      },
    };
  }

  return { success: false, status: 400, message: 'Invalid action type' };
};




////////// Get Orders //////////////////////////////////////////////
const getMyOrders = async (accessToken) => {
  try {
    if (!accessToken) {
      return { success: false, status: 401, message: 'Access token is required' };
    }

    const decoded = verifyToken(accessToken);
    const userId = decoded.userId;


    const carts = await Cart.find({ userId });
    const cartIds = carts.map(c => c._id);

    const orders = await Order.find({ cartId: { $in: cartIds } })
      .sort({ createdAt: -1 })
      .populate({
        path: 'cartId',
        populate: { path: 'items.productId', select: 'title price thumbnail' }
      });

    return {
      success: true,
      status: 200,
      data: orders
    };
  } catch (err) {
    console.error('[getMyOrders Error]', err);
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
  getCart,
  createOrder,
  getMyOrders,
  assignGuestCartToUser,
  requestGuestOtp,
  verifyGuestOrder
};
