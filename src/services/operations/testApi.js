import axios from 'axios';


// Function to submit test answers
export const submitTest = async (data, token) => {
  try {
    const response = await axios.post('http://localhost:4000/api/v1/test/evaluate', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting test:', error);
    return null;
  }
};

// Function to fetch test result
export const fetchTestResult = async (courseId, token) => {
  try {
    const response = await axios.get(`http://localhost:4000/api/v1/test/result/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching test result:', error);
    return null;
  }
};