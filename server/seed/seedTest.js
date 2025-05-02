const mongoose = require('mongoose');
const Test = require('../models/Test'); // Ensure this path matches your project structure

const seedTest = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Sample test data
    const testData = [
      {
        courseId: '6813982f053cd7a252c02b6c', // Replace with an actual courseId from your database
        questions: [
          {
            question: 'What is React?',
            correctAnswer: 'A JavaScript library for building user interfaces',
          },
          {
            question: 'What is the time complexity of accessing an array element by index?',
            correctAnswer: 'O(1)',
          },
        ],
      },
      {
        courseId: '6813982f053cd7a252c02b6c', // Replace with another courseId from your database
        questions: [
          {
            question: 'What is Node.js?',
            correctAnswer: 'A JavaScript runtime built on Chrome\'s V8 engine',
          },
          {
            question: 'What is MongoDB?',
            correctAnswer: 'A NoSQL database',
          },
        ],
      },
    ];

    // Insert test data into the Test collection
    await Test.insertMany(testData);
    console.log('Test data seeded successfully');

    // Close the database connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding test data:', error);
    mongoose.connection.close();
  }
};

seedTest();