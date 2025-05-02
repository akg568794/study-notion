const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  questions: [
    {
      question: { type: String, required: true },
      correctAnswer: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('Test', TestSchema);