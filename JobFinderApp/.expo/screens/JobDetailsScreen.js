import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobContext } from '../context/JobContext';

const JobDetailsScreen = ({ route }) => {
  const { job } = route.params;
  const { isBookmarked, toggleBookmark } = useContext(JobContext);
  
  const bookmarked = isBookmarked(job.id);

  // Helper function to safely convert any value to a renderable string
  const safeToString = (value) => {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'object') {
      // Handle specific object format with these keys
      if (value.Place || value.Salary || value.Job_Type || value.Experience || value.Fees_Charged || value.Qualification) {
        const parts = [];
        if (value.Place) parts.push(`Location: ${value.Place}`);
        if (value.Salary) parts.push(`Salary: ${value.Salary}`);
        if (value.Job_Type) parts.push(`Type: ${value.Job_Type}`);
        if (value.Experience) parts.push(`Experience: ${value.Experience}`);
        if (value.Fees_Charged) parts.push(`Fees: ${value.Fees_Charged}`);
        if (value.Qualification) parts.push(`Qualification: ${value.Qualification}`);
        
        return parts.join('\n');
      }
      
      // General object handling
      return JSON.stringify(value)
        .replace(/[{}"]/g, '')
        .replace(/,/g, ', ');
    }
    
    return String(value);
  };

  // Helper function to extract field value from contentV3
  const getContentV3FieldValue = (fieldKey) => {
    if (job.contentV3 && job.contentV3.V3 && Array.isArray(job.contentV3.V3)) {
      const field = job.contentV3.V3.find(item => item.field_key === fieldKey);
      return field ? field.field_value : null;
    }
    return null;
  };

  const handleCall = () => {
    const phoneNumber = job.whatsapp_no || job.phone;
    if (phoneNumber) {
      let phoneUrl = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
      Linking.openURL(phoneUrl);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this job: ${job.title} at ${job.company_name || 'a company'}`,
      });
    } catch (error) {
      console.error('Error sharing job:', error);
    }
  };

  // Helper function to render a detail item if the value exists
  const renderDetailItem = (icon, label, value, suffix = '') => {
    if (!value) return null;
    
    // Use the safe conversion function
    const displayValue = safeToString(value);
    
    return (
      <View style={styles.infoItem}>
        <Ionicons name={icon} size={20} color="#666" />
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoText}>{displayValue}{suffix}</Text>
      </View>
    );
  };

  // Helper function to format salary range
  const formatSalaryRange = () => {
    // First check if we have salary in primary_details
    if (job.primary_details && job.primary_details.Salary) {
      // Return "Not Mentioned" if the primary_details.Salary is "-"
      if (job.primary_details.Salary === "-") {
        return "Not Mentioned";
      }
      return job.primary_details.Salary;
    }
    
    // Check for v3:[] format
    if (job.salary === 'v3:[]' || job.salary_min === 'v3:[]' || job.salary_max === 'v3:[]' || 
        job.salary === '-' || job.salary_min === '-' || job.salary_max === '-') {
      return 'Not Mentioned';
    }
    
    if (job.salary_min && job.salary_max) {
      return `₹${job.salary_min} - ₹${job.salary_max}`;
    } else if (job.salary_min) {
      return `₹${job.salary_min}+`;
    } else if (job.salary_max) {
      return `Up to ₹${job.salary_max}`;
    } else if (job.fee_details && job.fee_details !== '-') {
      return job.fee_details;
    } else {
      return 'Not Mentioned';
    }
  };

  // Helper function to format location with job_location_slug
  const formatLocation = () => {
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
    
    return parts.join(', ');
  };

  // Helper function to render tags with proper styling
  const renderTags = () => {
    const tagsToRender = [];
    
    // Add job_tags if they exist
    if (job.job_tags && job.job_tags.length > 0) {
      job.job_tags.forEach((tag, index) => {
        tagsToRender.push(
          <View 
            key={`job-tag-${index}`} 
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
        );
      });
    }
    
    // If we have openings_count but no job_tags for it, add it as a tag
    if ((!job.job_tags || !job.job_tags.some(tag => tag.value && tag.value.includes('Vacanc'))) && 
        job.openings_count && job.openings_count > 0) {
      tagsToRender.push(
        <View 
          key="openings-tag" 
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
      );
    }
    
    // Add regular tags
    if (job.tags && job.tags.length > 0) {
      job.tags.forEach((tag, index) => {
        tagsToRender.push(
          <View key={`tag-${index}`} style={styles.tagItem}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        );
      });
    }
    
    return tagsToRender;
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
  
  // Get shift timing from contentV3
  const shiftTiming = getContentV3FieldValue('Shift timing');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <TouchableOpacity onPress={() => toggleBookmark(job)} style={styles.bookmarkButton}>
          <Ionicons 
            name={bookmarked ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color={bookmarked ? '#007BFF' : '#333'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoSection}>
        {renderDetailItem('business-outline', 'Company', job.company_name)}
        {renderDetailItem('location-outline', 'Location', formatLocation())}
        {renderDetailItem('cash-outline', 'Salary', formatSalaryRange())}
        {renderDetailItem('briefcase-outline', 'Type', jobTypeText)}
        {renderDetailItem('school-outline', 'Qualification', qualificationText)}
        {renderDetailItem('time-outline', 'Experience', experienceText)}
        {renderDetailItem('time-outline', 'Shift', shiftTiming || job.shift_timing)}
        {renderDetailItem('people-outline', 'Openings', job.openings_count)}
        {renderDetailItem('hourglass-outline', 'Hours', job.job_hours)}
        {job.job_role && renderDetailItem('person-outline', 'Role', job.job_role)}
      </View>
      
      {(job.primary_details || job.contentV3) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {safeToString(job.primary_details || job.contentV3)}
          </Text>
        </View>
      )}
      
      {job.other_details && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Details</Text>
          <Text style={styles.descriptionText}>
            {safeToString(job.other_details)}
          </Text>
        </View>
      )}
      
      {/* Tags section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagsContainer}>
          {renderTags()}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        {job.whatsapp_no && (
          <TouchableOpacity 
            style={[styles.contactButton, { backgroundColor: '#25D366' }]} 
            onPress={() => {
              Linking.openURL(`whatsapp://send?phone=${job.whatsapp_no}`);
            }}
          >
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
        
        {(job.whatsapp_no || job.phone) && (
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.contactButton, { backgroundColor: '#4267B2' }]} 
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={20} color="white" />
          <Text style={styles.contactButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Posted: {new Date(job.created_on).toLocaleDateString()}</Text>
        {job.updated_on && job.updated_on !== job.created_on && (
          <Text style={styles.footerText}>Updated: {new Date(job.updated_on).toLocaleDateString()}</Text>
        )}
        {job.expire_on && (
          <Text style={styles.footerText}>Expires: {new Date(job.expire_on).toLocaleDateString()}</Text>
        )}
        <Text style={styles.footerText}>Views: {job.views || 0}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  bookmarkButton: {
    padding: 8,
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoLabel: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    width: 100,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  section: {
    marginVertical: 12,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: '#e1e1e1',
  },
  tagText: {
    fontSize: 14,
    color: '#555',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  contactButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
});

export default JobDetailsScreen;
