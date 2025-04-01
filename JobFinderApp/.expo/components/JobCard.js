import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobContext } from '../context/JobContext';
import { useRef, useEffect } from 'react';

const JobCard = ({ job, onPress }) => {
  const { isBookmarked, toggleBookmark } = useContext(JobContext);
  const bookmarked = isBookmarked(job.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animation effect when component mounts
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.03,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBookmarkPress = (e) => {
    e.stopPropagation();
    
    // Animate the bookmark icon when pressed
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    toggleBookmark(job);
  };

  // Helper function to safely convert any value to a string
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value).replace(/[{}"]/g, '').replace(/,/g, ', ');
    return String(value);
  };

  const formatJobLocation = (job) => {
    const parts = [];
    
    // Add locality if available
  
    // Fix: Add safe type checking before using includes method
    if (job.job_location_slug) {
      const shouldAdd = !parts.some(part => {
        // Make sure part is a string before calling includes
        if (typeof part !== 'string' || part === undefined) return false;
        
        // Ensure job_location_slug is a string
        const slug = String(job.job_location_slug);
        return part.includes(slug) || slug.includes(part);
      });
      
      if (shouldAdd) {
        parts.push(job.job_location_slug);
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  // Helper function to check if salary is V3:[] or empty
  const isSalaryEmpty = (salary) => {
    return salary === 'V3:[]' || !salary;
  };

  // Helper function to get proper text representation for fields that might be numbers
  const getFieldTextValue = (field, primaryDetailsField) => {
    if (typeof field === 'number' && job.primary_details && job.primary_details[primaryDetailsField]) {
      return job.primary_details[primaryDetailsField];
    }
    return field;
  };

  // Process fields that might be numbers
  const experienceText = getFieldTextValue(job.experience, 'Experience');
  const jobTypeText = getFieldTextValue(job.job_type, 'Job_Type');
  const qualificationText = getFieldTextValue(job.qualification, 'Qualification');

  // Get salary from primary details if available
  const getSalaryDisplay = () => {
    if (job.primary_details && job.primary_details.Salary) {
      // Return "Not Mentioned" if the primary_details.Salary is "-"
      if (job.primary_details.Salary === "-") {
        return "Not Mentioned";
      }
      return job.primary_details.Salary;
    }
    
    if (isSalaryEmpty(job.fee_details) || job.fee_details === '-') {
      return 'Not Mentioned';
    }
    
    if (job.salary_min && job.salary_max) {
      return `₹${job.salary_min} - ₹${job.salary_max}`;
    } else if (job.salary_min) {
      return `₹${job.salary_min}+`;
    } else if (job.salary_max) {
      return `Up to ₹${job.salary_max}`;
    } else {
      return safeToString(job.fee_details);
    }
  };

  return (
    <Animated.View style={[
      styles.cardContainer,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{job.title || 'Untitled Job'}</Text>
          
          <View style={styles.rightHeader}>
            {job.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
            <TouchableOpacity 
              onPress={handleBookmarkPress}
              style={styles.bookmarkButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={bookmarked ? 'bookmark' : 'bookmark-outline'} 
                size={22} 
                color={bookmarked ? '#007BFF' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.companyRow}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.companyName} numberOfLines={1}>
            {job.company_name || 'Unknown Company'}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          {job.city_location && (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {formatJobLocation(job)}
              </Text>
            </View>
          )}

          {(job.primary_details?.Salary || job.salary_min || job.salary_max || job.fee_details) && (
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {getSalaryDisplay()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footerRow}>
          {jobTypeText && (
            <View style={styles.tagItem}>
              <Text style={styles.tagText}>{jobTypeText}</Text>
            </View>
          )}
          
          {job.job_tags && job.job_tags.length > 0 && job.job_tags.map((tag, index) => (
            <View 
              key={index} 
              style={[
                styles.tagItem, 
                {
                  backgroundColor: tag.bg_color || '#E7F3FE'
                }
              ]}
            >
              <Text 
                style={[
                  styles.tagText, 
                  {
                    color: tag.text_color || '#0E56A8'
                  }
                ]}
              >
                {tag.value}
              </Text>
            </View>
          ))}
          
          {(!job.job_tags || job.job_tags.length === 0) && job.openings_count > 0 && (
            <View 
              style={[
                styles.tagItem, 
                { backgroundColor: '#E7F3FE' }
              ]}
            >
              <Text 
                style={[
                  styles.tagText, 
                  { color: '#0E56A8' }
                ]}
              >
                {job.openings_count} {job.openings_count === 1 ? 'Vacancy' : 'Vacancies'}
              </Text>
            </View>
          )}
          
          {experienceText && (
            <View style={styles.tagItem}>
              <Text style={styles.tagText}>{experienceText}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Posted: {new Date(job.created_on).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 8,
    marginVertical: 6,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  premiumText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookmarkButton: {
    padding: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#666',
    fontSize: 12,
  },
  dateRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateText: {
    color: '#999',
    fontSize: 12,
  },
});

export default JobCard;
