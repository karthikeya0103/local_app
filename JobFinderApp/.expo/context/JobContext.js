import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
// Use a try-catch for the import to make it fault-tolerant
let Haptics;
try {
  Haptics = require('expo-haptics');
} catch (error) {
  // Create a mock Haptics object if the library isn't available
  Haptics = {
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Medium: 'medium' },
    NotificationFeedbackType: { Success: 'success' }
  };
  console.warn('expo-haptics is not installed. Haptic feedback will be disabled.');
}

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Enhanced load bookmarks function with error handling and retry logic
  const loadBookmarks = async (retryCount = 0) => {
    try {
      setLoading(true);
      const storedBookmarks = await AsyncStorage.getItem('jobBookmarks');
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
      
      // Retry logic for corrupted data
      if (retryCount === 0) {
        console.log("Attempting to recover bookmarks data...");
        try {
          // Clear potentially corrupted data and retry
          await AsyncStorage.removeItem('jobBookmarks');
          return loadBookmarks(retryCount + 1);
        } catch (clearError) {
          console.error('Failed to clear corrupted bookmarks:', clearError);
        }
      }
      
      setError('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  // Load bookmarks from AsyncStorage on app start with improved reliability
  useEffect(() => {
    loadBookmarks();
    fetchJobs(1); // Fetch jobs on initial load
  }, []);

  // Fetch jobs from API
  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://testapi.getlokalapp.com/common/jobs?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const responseData = await response.json();
      
      // Handle different possible response structures
      let jobsArray;
      if (Array.isArray(responseData)) {
        jobsArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Check for common response patterns like data.results, data.jobs, etc.
        jobsArray = responseData.results || responseData.jobs || responseData.data || [];
      } else {
        jobsArray = [];
      }
      
      if (page === 1) {
        setJobs(jobsArray);
      } else {
        setJobs(prevJobs => [...prevJobs, ...jobsArray]);
      }
      
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load more jobs (pagination)
  const loadMoreJobs = () => {
    if (!loading) {
      fetchJobs(currentPage + 1);
    }
  };

  // Enhanced function to save bookmarks to AsyncStorage with validation
  const saveBookmarks = async (updatedBookmarks) => {
    try {
      // Validate data before storing
      if (!Array.isArray(updatedBookmarks)) {
        throw new Error('Invalid bookmark data format');
      }
      
      // Ensure we only store essential job data to minimize storage usage
      const essentialJobData = updatedBookmarks.map(job => {
        // Process fields that might be numbers
        let processedExperience = job.experience;
        let processedJobType = job.job_type;
        let processedQualification = job.qualification;
        let processedSalary = null;
        
        // If experience is a number, use the value from primary_details
        if (typeof job.experience === 'number' && job.primary_details && job.primary_details.Experience) {
          processedExperience = job.primary_details.Experience;
        }
        
        // If job_type is a number, use the value from primary_details
        if (typeof job.job_type === 'number' && job.primary_details && job.primary_details.Job_Type) {
          processedJobType = job.primary_details.Job_Type;
        }
        
        // If qualification is a number, use the value from primary_details
        if (typeof job.qualification === 'number' && job.primary_details && job.primary_details.Qualification) {
          processedQualification = job.primary_details.Qualification;
        }
        
        // Use Salary from primary_details if available
        if (job.primary_details && job.primary_details.Salary) {
          processedSalary = job.primary_details.Salary;
        }
        
        return {
          id: job.id,
          title: job.title,
          company_name: job.company_name,
          salary: processedSalary || job.salary,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          experience: processedExperience,
          locality: job.locality,
          city_location: job.city_location,
          job_type: processedJobType,
          qualification: processedQualification,
          primary_details: job.primary_details,
          contentV3: job.contentV3,
          other_details: job.other_details,
          whatsapp_no: job.whatsapp_no,
          phone: job.phone,
          job_tags: job.job_tags,
          openings_count: job.openings_count,
          tags: job.tags,
          created_on: job.created_on,
          updated_on: job.updated_on,
          expire_on: job.expire_on,
          views: job.views,
          // Add any other essential fields needed for offline viewing
        };
      });
      
      // Store the data with a timestamp for potential cache management later
      const bookmarksData = {
        timestamp: new Date().toISOString(),
        jobs: essentialJobData
      };
      
      await AsyncStorage.setItem('jobBookmarks', JSON.stringify(bookmarksData));
      
      // Create an additional backup copy for redundancy
      await AsyncStorage.setItem('jobBookmarks_backup', JSON.stringify(bookmarksData));
      
    } catch (err) {
      console.error('Error saving bookmarks:', err);
      setError('Failed to save job');
      
      // If saving fails, show an alert
      Alert.alert(
        'Storage Error',
        'Failed to save job to local storage. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const isBookmarked = (jobId) => {
    return bookmarks.some(job => job.id === jobId);
  };

  // Function to safely trigger haptic feedback
  const triggerHaptic = (type, style) => {
    try {
      if (Platform.OS === 'ios') {
        if (type === 'impact') {
          Haptics.impactAsync(style || Haptics.ImpactFeedbackStyle.Medium);
        } else if (type === 'notification') {
          Haptics.notificationAsync(style || Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      // Silently fail if haptics don't work
      console.debug('Haptic feedback failed:', error.message);
    }
  };

  // Modified toggleBookmark function
  const toggleBookmark = (job) => {
    // Add haptic feedback for better user experience
    triggerHaptic('impact');
    
    setBookmarks(prevBookmarks => {
      let updatedBookmarks;
      
      if (isBookmarked(job.id)) {
        // Remove job from bookmarks
        updatedBookmarks = prevBookmarks.filter(bookmark => bookmark.id !== job.id);
      } else {
        // Add job to bookmarks
        updatedBookmarks = [...prevBookmarks, job];
        
        // Show confirmation for better UX
        Alert.alert(
          'Job Bookmarked',
          'This job is now available for offline viewing',
          [{ text: 'Great!', style: 'default' }],
          { cancelable: true }
        );
      }
      
      // Save to AsyncStorage using the enhanced function
      saveBookmarks(updatedBookmarks);
      
      return updatedBookmarks;
    });
  };

  const clearBookmarks = () => {
    Alert.alert(
      'Clear All Bookmarks',
      'Are you sure you want to remove all bookmarked jobs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('jobBookmarks');
              setBookmarks([]);
              // Add haptic feedback
              triggerHaptic('notification');
            } catch (err) {
              console.error('Error clearing bookmarks:', err);
              setError('Failed to clear bookmarks');
            }
          }
        }
      ]
    );
  };

  // Add a function to verify and repair bookmarks storage if needed
  const verifyAndRepairBookmarks = async () => {
    try {
      const mainBookmarks = await AsyncStorage.getItem('jobBookmarks');
      const backupBookmarks = await AsyncStorage.getItem('jobBookmarks_backup');
      
      if (!mainBookmarks && backupBookmarks) {
        // Restore from backup if main is missing
        await AsyncStorage.setItem('jobBookmarks', backupBookmarks);
        return JSON.parse(backupBookmarks);
      }
      
      return mainBookmarks ? JSON.parse(mainBookmarks) : [];
    } catch (err) {
      console.error('Error verifying bookmarks storage:', err);
      return [];
    }
  };

  return (
    <JobContext.Provider 
      value={{ 
        bookmarks, 
        isBookmarked, 
        toggleBookmark, 
        clearBookmarks,
        jobs,
        loading,
        error,
        fetchJobs,
        loadMoreJobs,
        verifyAndRepairBookmarks // Expose the new verification function
      }}
    >
      {children}
    </JobContext.Provider>
  );
};
