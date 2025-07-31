const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controllers');

router.post('/adminLogin', adminController.adminLogin); 
router.post('/create', adminController.createNewUser); 
router.post('/dashboardInfo',  adminController.getAdminDashboardStats); 
router.put('/user/update', adminController.updateUserInfo); 
router.delete('/user/delete', adminController.deleteUserById); 
router.post('/getTeacherStat', adminController.getTeacherStats); 
router.post('/getAdminLatestStats', adminController.getAdminLatestStats); 
router.post('/getAllCourseStats', adminController.getAllCourseStats); 
router.post('/getAllOrders', adminController.getAllOrders); 

module.exports = router;
