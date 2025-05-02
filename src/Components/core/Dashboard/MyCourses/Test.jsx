import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { submitTest, fetchTestResult } from '../../../../services/operations/testApi';
import axios from 'axios';
import { BiArrowBack } from 'react-icons/bi';

const Test = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:4000/api/v1/test/questions/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setQuestions(response.data.questions);
        } else {
          console.error('Failed to fetch questions:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [courseId, token]);

  const handleSubmit = async () => {
    setLoading(true);
    const response = await submitTest({ courseId, answers }, token);
    if (response) {
      setResult(response);
      setShowResult(true);
    }
    setLoading(false);
  };

  const handleOptionSelect = (option) => {
    setAnswers({
      ...answers,
      [currentQuestion]: option,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] p-6">
        <div className="max-w-3xl mx-auto bg-richblack-800 p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-richblack-5 mb-6">Test Results</h1>
          <div className="bg-richblack-700 p-8 rounded-lg text-center">
            <div className={`text-4xl font-bold mb-4 ${result.passed ? 'text-caribbeangreen-300' : 'text-pink-200'}`}>
              {result.passed ? 'Congratulations! 🎉' : 'Better Luck Next Time! 📚'}
            </div>
            <p className="text-xl text-richblack-100">
              {result.passed ? 'You have passed the test!' : 'You did not pass the test.'}
            </p>
            {result.passed && result.certificateUrl && (
              <a
                href={result.certificateUrl}
                className="mt-6 inline-block px-6 py-3 bg-yellow-50 text-richblack-900 rounded-md hover:scale-95 transition-all duration-200"
              >
                Download Certificate
              </a>
            )}
            <button
              onClick={() => navigate(`/dashboard/enrolled-courses/view-course/${courseId}`)}
              className="mt-6 px-6 py-3 bg-richblack-700 text-richblack-50 rounded-md hover:bg-richblack-600 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <BiArrowBack /> Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-richblack-5">Course Test</h1>
          <div className="text-richblack-300">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="bg-richblack-800 p-6 rounded-lg">
            <div className="mb-8">
              <div className="w-full bg-richblack-700 h-2 rounded-full">
                <div
                  className="bg-caribbeangreen-300 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl text-richblack-50 font-semibold mb-4">
                {questions[currentQuestion].question}
              </h2>
              <div className="space-y-4">
                {questions[currentQuestion].options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`block p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      answers[currentQuestion] === option
                        ? 'bg-caribbeangreen-100 text-richblack-900'
                        : 'bg-richblack-700 text-richblack-100 hover:bg-richblack-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={answers[currentQuestion] === option}
                      onChange={() => handleOptionSelect(option)}
                      className="hidden"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-6 py-3 rounded-md transition-all duration-200 flex items-center gap-2 
                  ${currentQuestion === 0
                    ? 'bg-richblack-600 text-richblack-300 cursor-not-allowed'
                    : 'bg-richblack-700 text-richblack-50 hover:bg-richblack-600'
                  }`}
              >
                <BiArrowBack /> Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-yellow-50 text-richblack-900 rounded-md hover:scale-95 transition-all duration-200"
                >
                  {loading ? 'Submitting...' : 'Submit Test'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-yellow-50 text-richblack-900 rounded-md hover:scale-95 transition-all duration-200"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;