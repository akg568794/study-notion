import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { submitTest, fetchTestResult } from '../../../../services/operations/testApi';
import axios from 'axios';
import { BiArrowBack } from 'react-icons/bi';
import TestProctoring from './TestProctoring';
import { toast } from 'react-hot-toast';
import CertificateGenerator from './CertificateGenerator';

const Test = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const { courseSectionData } = useSelector((state) => state.viewCourse);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [isTestActive, setIsTestActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreTestInfo, setShowPreTestInfo] = useState(true);

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isTestActive) return; // Prevent multiple submissions
    
    setIsTestActive(false); // Disable further test interactions
    setLoading(true);
    
    // Clear any existing loading toasts
    toast.dismiss();

    const response = await submitTest({ courseId, answers }, token);
    if (response) {
      setResult(response);
      setShowResult(true);
    }
    setLoading(false);
  };

  // Handle violations from proctoring
  const handleViolation = useCallback((message) => {
    if (!isTestActive) return; // Don't process violations if test is already submitted
    
    toast.error(message);
    setViolationCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        handleSubmit(true);
        return prev;
      }
      return newCount;
    });
  }, [isTestActive]);

  // Handle fatal violations that should end the test immediately
  const handleFatalViolation = useCallback((message) => {
    if (!isTestActive) return;
    
    toast.error(message);
    handleSubmit(true);
  }, [isTestActive]);

  // Function to handle entering fullscreen
  const enterFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }, []);

  // Function to check if browser is in fullscreen mode
  const isInFullscreen = () => {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenStatus = isInFullscreen();
      setIsFullscreen(fullscreenStatus);
      
      if (!fullscreenStatus && isTestActive) {
        // Auto-submit when exiting fullscreen
        handleSubmit(true);
        toast.error("Test auto-submitted: Fullscreen mode exited");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isTestActive]);

  // Start test in fullscreen when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && isTestActive && !isFullscreen) {
      enterFullscreen();
    }
  }, [questions, isTestActive, isFullscreen, enterFullscreen]);

  // Prevent tab switching
  useEffect(() => {
    if (!isTestActive) return; // Don't track visibility if test is inactive

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPageVisible(false);
        handleViolation("Tab switching detected");
      } else {
        setPageVisible(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleViolation, isTestActive]);

  // Prevent copying and text selection
  useEffect(() => {
    if (!isTestActive) return;

    const handleCopy = (e) => {
      e.preventDefault();
      handleViolation("Copying content is not allowed");
    };

    const handlePaste = (e) => {
      e.preventDefault();
      handleViolation("Pasting content is not allowed");
    };

    const handleSelect = (e) => {
      e.preventDefault();
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        window.getSelection().removeAllRanges();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Prevent dragging
    const handleDragStart = (e) => {
      e.preventDefault();
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("selectstart", handleSelect);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    // Add CSS to disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("selectstart", handleSelect);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      
      // Reset CSS
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, [handleViolation, isTestActive]);

  // Prevent keyboard shortcuts
  useEffect(() => {
    if (!isTestActive) return; // Don't track keyboard shortcuts if test is inactive

    const handleKeyDown = (e) => {
      // Prevent common shortcuts
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 'c' || e.key === 'p' || e.key === 's' || e.key === 'u' || 
           e.key === 'a' || e.key === 'k' || e.key === 'i')) {
        e.preventDefault();
        handleViolation("Keyboard shortcuts are not allowed");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleViolation, isTestActive]);

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

  const startTest = () => {
    setShowPreTestInfo(false);
    setIsTestActive(true);
    enterFullscreen();
  };

  if (showPreTestInfo) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] p-6">
        <div className="max-w-3xl mx-auto bg-richblack-800 p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-richblack-5 mb-6">Important Test Information</h1>
          
          <div className="space-y-6 text-richblack-100">
            <h2 className="text-xl font-semibold text-yellow-50">Please read carefully before starting:</h2>
            
            <div className="bg-richblack-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-200 mb-2">⚠️ Test Rules:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>The test must be taken in fullscreen mode</li>
                <li>Tab switching or leaving the test window is not allowed</li>
                <li>Text selection is disabled during the test</li>
                <li>Keyboard shortcuts are disabled</li>
                <li>No other person should be visible in the camera</li>
                <li>No phones or other devices are allowed</li>
              </ul>
            </div>

            <div className="bg-richblack-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-caribbeangreen-300 mb-2">ℹ️ Important Notes:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You will receive warnings for rule violations</li>
                <li>After 10 violations, the test will be automatically submitted</li>
                <li>A stable internet connection is required</li>
                <li>Ensure your webcam is working properly</li>
                <li>Once started, the test cannot be paused</li>
              </ul>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={startTest}
                className="px-6 py-3 bg-yellow-50 text-richblack-900 rounded-md hover:scale-95 transition-all duration-200 font-semibold"
              >
                I understand, Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {result.passed && (
              <CertificateGenerator
                userId={result.userId}
                courseId={courseId}
                userName={result.userName || "Student"}
                courseName={result.courseName || "Course"}
                completionDate={new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              />
            )}
            <button
              onClick={() => navigate(`/dashboard/enrolled-courses/view-course/${courseId}/section/${courseSectionData?.[0]?._id}/sub-section/${courseSectionData?.[0]?.subSection?.[0]?._id}`)}
              className=" mt-5 px-6 bg-richblack-700 text-richblack-50 rounded-md hover:bg-richblack-600 transition-all duration-200 flex items-center gap-2 mx-auto"
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
      {/* Proctoring Component */}
      <TestProctoring 
        onViolation={handleViolation}
        onFatalViolation={handleFatalViolation}
      />

      {/* Violation Counter */}
      <div className="fixed top-4 left-4 bg-richblack-800 p-2 rounded-lg">
        <p className="text-sm text-richblack-50">
          Violations: <span className="text-pink-200">{violationCount}/10</span>
        </p>
      </div>

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
                  onClick={() => handleSubmit(false)}
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