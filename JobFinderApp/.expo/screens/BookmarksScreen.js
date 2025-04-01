import React, { useContext, useState } from 'react';
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  Platform 
} from 'react-native';
import { JobContext } from '../context/JobContext';
import JobCard from '../components/JobCard';
import { Ionicons } from '@expo/vector-icons';

// Use a try-catch for the import to handle missing asset gracefully
let emptyBookmarksImage;
try {
  // Attempt to import the image
  emptyBookmarksImage = require('../../assets/empty-bookmarks.png');
} catch (error) {
  // If image can't be found, set to null and we'll use an icon instead
  console.warn("Couldn't load empty-bookmarks.png, will use fallback icon");
  emptyBookmarksImage = null;
}

const BookmarksScreen = ({ navigation }) => {
  const { bookmarks, clearBookmarks, loading, error } = useContext(JobContext);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading saved jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          {emptyBookmarksImage ? (
            <Image 
              source={emptyBookmarksImage} 
              style={styles.emptyImage}
            />
          ) : (
            // Fallback to an icon if image is missing
            <Ionicons name="bookmark-outline" size={80} color="#ccc" />
          )}
          <Text style={styles.emptyText}>No bookmarked jobs yet</Text>
          <Text style={styles.emptySubText}>
            Jobs you bookmark will appear here for offline viewing
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Jobs')}
          >
            <Text style={styles.browseButtonText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Saved Jobs</Text>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearBookmarks}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={bookmarks}
        renderItem={({ item }) => (
          <JobCard 
            job={item} 
            onPress={() => navigation.navigate('JobDetails', { job: item })}
          />
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007BFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    tintColor: '#ccc',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookmarksScreen;
