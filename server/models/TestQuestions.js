const mongoose = require('mongoose');

const TestQuestionsSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  questions: [
    {
      question: { type: String, required: true },
      options: { type: [String], required: true },
      correctAnswer: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('TestQuestions', TestQuestionsSchema, 'testquestions'); 