/**
 * Main routes file
 * Combines all route modules
 */

const express = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const activityRoutes = require('./activityRoutes');

const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'user-service',
      version: '1.0.0',
      status: 'running'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/activities', activityRoutes);

module.exports = router;
