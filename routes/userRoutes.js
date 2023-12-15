const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.googleAuthSignUp, authController.signup);
router.post('/emailConfirm/:token', authController.emailConfirm);
router.post('/login', authController.googleAuthLogin, authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  // authController.protect,
  authController.updatePassword
);
router.get(
  '/me',
  // authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateMe',
  // authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete(
  '/deleteMe',
  // authController.protect,
  userController.deleteMe
);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
