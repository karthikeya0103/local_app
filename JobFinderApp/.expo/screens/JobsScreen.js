import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  RefreshControl,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import JobCard from '../components/JobCard';
import NetInfo from '@react-native-community/netinfo';
import { JobContext } from '../context/JobContext';

// Create an animated version of FlatList to support native driver
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const JobsScreen = ({ navigation }) => {
  const { jobs, loading, error, loadMoreJobs, fetchJobs } = useContext(JobContext);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  
  // Helper function to handle salary formatting
  const formatSalary = (salary) => {
    // Check for v3:[] format with case insensitive comparison
    if (salary && (typeof salary === 'string') && 
        (salary.toUpperCase() === 'V3:[]' || 
         /^V3:\[.*\]$/i.test(salary))) {
      return 'Not Mentioned';
    }
    return salary;
  };
  
  // Animation for the floating "scroll to top" button
  const scrollY = new Animated.Value(0);
  const scrollButtonOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  // Ref for FlatList to implement scroll to top
  const flatListRef = React.useRef(null);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchJobs(1, true);
  }, []);

  // Remove or hide the title in the header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Option 1: Hide the header completely
      // OR
      // headerTitle: '', // Option 2: Keep header but remove the text
    });
  }, [navigation]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchJobs(page + 1);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchJobs(1, true);
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  };

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchJobs(1)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isConnected && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>No Internet Connection</Text>
        </View>
      )}
      <AnimatedFlatList
        ref={flatListRef}
        data={jobs}
        renderItem={({ item }) => {
          if (!item) {
            console.log('Undefined job item encountered');
            return null;
          }
          
          return (
            <JobCard 
              job={item} 
              formatSalary={formatSalary} // Pass the helper function
              onPress={() => navigation.navigate('JobDetails', { job: item })}
            />
          );
        }}
        keyExtractor={(item, index) => {
          if (!item) return `missing-item-${index}`;
          // Make sure the key is truly unique by combining id with index if needed
          return `job-${item.id}-${index}`;
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.centered}>
              <Text>No jobs available</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />
      <Animated.View style={[styles.scrollToTopButton, { opacity: scrollButtonOpacity }]}>
        <TouchableOpacity onPress={() => flatListRef.current.scrollToOffset({ animated: true, offset: 0 })}>
          <Ionicons name={Platform.OS === 'ios' ? 'ios-arrow-up' : 'md-arrow-up'} size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 10,
    color: 'blue',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  offlineContainer: {
    backgroundColor: '#b52424',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  offlineText: {
    color: '#fff',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#000',
    borderRadius: 50,
    padding: 10,
    elevation: 5,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007BFF',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 10,
    fontSize: 14,
    color: '#007BFF',
  },
});

export default JobsScreen;
