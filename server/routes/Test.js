const express = require('express');
const { evaluateTest, getTestResult, getTestQuestions } = require('../controllers/Test');
const {auth, isStudent} = require('../middlewares/auth');
const router = express.Router();

router.post('/evaluate', auth,isStudent, evaluateTest); // Apply middleware here
router.get('/result/:courseId', auth,isStudent, getTestResult);
router.get('/questions/:courseId', getTestQuestions);

module.exports = router;