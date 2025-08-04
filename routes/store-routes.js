const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store-controller');

// ---------- Product Routes ----------
router.post('/createProduct', storeController.createProduct);
router.get('/getAllProducts', storeController.getAllProducts); 
router.post('/getProductById', storeController.getProductById);
router.put('/updateProduct', storeController.updateProduct); 
router.delete('/deleteProduct', storeController.deleteProduct); 
// ---------- Cart Routes ----------
router.post('/addItemToCart', storeController.addItemToCart);
router.post('/assignGuestCartToUser', storeController.assignGuestCartToUser);
router.get('/getCart', storeController.getCart);
router.delete('/removeItemFromCart', storeController.removeItemFromCart); 
router.delete('/clearCart', storeController.clearCart); 
router.post('/makeOrder', storeController.makeOrder); 
router.post('/getMyOrders', storeController.getMyOrders); 
router.post('/guestOrderReq', storeController.requestOtp); 
router.post('/verifyGuestOrder', storeController.verifyOrder); 

module.exports = router;
