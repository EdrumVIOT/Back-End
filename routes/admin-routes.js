const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controllers');

router.post('/adminLogin', adminController.adminLogin); 
router.post('/create', adminController.createNewUser); 
router.get('/dashboardInfo',  adminController.getAdminDashboardStats); 
router.put('/user/update', adminController.updateUserInfo); 
router.delete('/user/delete', adminController.deleteUserById); 
router.get('/getTeacherStat', adminController.getTeacherStats); 
router.get('/getAdminLatestStats', adminController.getAdminLatestStats); 

module.exports = router;
