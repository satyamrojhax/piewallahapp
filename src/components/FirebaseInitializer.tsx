import { useEffect } from 'react';
import { syncUserDataWithFirebase } from '@/services/userService';
import { getEnrolledBatches } from '@/lib/enrollmentUtils';

/**
 * FirebaseInitializer Component
 * 
 * This component handles Firebase initialization and data synchronization.
 * It should be placed once in the app component tree to ensure Firebase
 * operations are properly set up when the app starts.
 */
export const FirebaseInitializer = () => {
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if user is logged in
        const userData = localStorage.getItem('user_data');
        const authToken = localStorage.getItem('param_auth_token') || sessionStorage.getItem('param_auth_token');
        
        if (userData && authToken) {
          try {
            // Sync user profile data with Firebase
            await syncUserDataWithFirebase();
            
            // Trigger batch enrollment sync (this will also update localStorage)
            await getEnrolledBatches();
            
            // Firebase initialization completed
          } catch (error) {
            // Firebase initialization failed
          }
        } else {
          // User not logged in, skipping Firebase sync
        }
      } catch (error) {
        // Don't throw error - app should continue to work even if Firebase fails
      }
    };

    // Initialize Firebase when component mounts
    initializeFirebase();
  }, []);

  // This component doesn't render anything
  return null;
};

export default FirebaseInitializer;
