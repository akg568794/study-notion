const Test = require('../models/Test');
const TestResult = require('../models/TestResult');
const TestQuestions = require('../models/TestQuestions');
const Certificate = require('../utils/certifcateGenerator');

exports.evaluateTest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { courseId, answers } = req.body;
    console.log("asnwers:", answers);
    const test = await TestQuestions.findOne({ courseId });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found for the given courseId' });
    }

    let passed = true;

    test.questions.forEach((q, index) => {
      // Access the answer using numeric keys (e.g., '0', '1', etc.)
      const userAnswer = answers[index.toString()]; // Convert index to string to match the keys in the answers object

      console.log("User Answer:", userAnswer, "Correct Answer:", q.correctAnswer);

      if (q.correctAnswer !== userAnswer) {
        passed = false;
      }
    });

    // Save the test result
    const testResult = await TestResult.create({
      userId: req.user.id,
      courseId,
      passed,
    });

    // if (passed) {
    //   const certificateUrl = await Certificate.generate(req.user.id, courseId);
    //   return res.status(200).json({ success: true, passed, certificateUrl });
    // }

    res.status(200).json({ success: true, passed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTestResult = async (req, res) => {
  try {
    const { courseId } = req.params;
    const testResult = await TestResult.findOne({
      userId: req.user.id,
      courseId,
    });

    if (!testResult) {
      return res.status(404).json({ success: false, message: 'Test result not found' });
    }

    res.status(200).json({ success: true, data: testResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Query the TestQuestions collection using courseId as a String
    const test = await TestQuestions.findOne({ courseId });
    console.log("Test questions:", test);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found for the given courseId' });
    }

    res.status(200).json({ success: true, questions: test.questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};