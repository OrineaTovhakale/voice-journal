import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { VoiceNote } from '../types';
import {
  saveNoteLocally,
  loadNotesLocally,
  deleteNoteLocally,
} from '../services/localStorageService.ts';

// Fixed format functions (no import errors)
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const {
    isPlaying,
    currentPlayingId,
    playSound,
    stopSound,
  } = useAudioPlayer();

  useEffect(() => {
    requestPermissions();
    loadVoiceNotes();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice notes.');
      }
    } catch (error) {
      console.error('Failed to get permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const loadVoiceNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const notes = await loadNotesLocally();
      setVoiceNotes(notes);
    } catch (error) {
      console.error('Error loading voice notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    if (result) {
      const title = newTitle.trim() || `Recording ${voiceNotes.length + 1}`;

      const newNote: VoiceNote = {
        id: Date.now().toString(),
        title: title,
        uri: result.uri!,
        duration: result.duration,
        createdAt: new Date(),
      };

      await saveNoteLocally(newNote);
      setVoiceNotes(prev => [newNote, ...prev]);
      setNewTitle('');

      Alert.alert('Recording Saved!', `${title}\nDuration: ${formatDuration(result.duration)}`);
    }
  };

  const handlePlayPause = async (note: VoiceNote) => {
    if (currentPlayingId === note.id && isPlaying) {
      stopSound();
    } else {
      playSound(note.uri, note.id);
    }
  };

  const handleDelete = (note: VoiceNote) => {
    Alert.alert('Delete Recording', 'Are you sure you want to delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNoteLocally(note.id);
          setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
          if (currentPlayingId === note.id) stopSound();
        },
      },
    ]);
  };

  // Search by title or date
  const filteredNotes = voiceNotes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    formatDate(note.createdAt).toLowerCase().includes(search.toLowerCase())
  );

  const renderVoiceNote = ({ item }: { item: VoiceNote }) => {
    const isCurrentlyPlaying = currentPlayingId === item.id && isPlaying;

    return (
      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{item.title}</Text>
          <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.noteControls}>
          <Text style={styles.noteDuration}>{formatDuration(item.duration)}</Text>
          <View style={styles.noteButtons}>
            <TouchableOpacity
              style={[styles.iconButton, isCurrentlyPlaying && styles.playingButton]}
              onPress={() => handlePlayPause(item)}
            >
              <Text style={styles.iconButtonText}>{isCurrentlyPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Journal</Text>

      {!hasPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.statusText}>Microphone Permission: Denied</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.recordingSection}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
            )}

            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>

            {isRecording && (
              <TextInput
                style={styles.titleInput}
                placeholder="Enter title..."
                placeholderTextColor="#999"
                value={newTitle}
                onChangeText={setNewTitle}
              />
            )}

            <View style={styles.buttonContainer}>
              {!isRecording ? (
                <TouchableOpacity style={[styles.recordButton, styles.startButton]} onPress={startRecording}>
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={[styles.recordButton, styles.stopButton]} onPress={handleStopRecording}>
                    <Text style={styles.recordButtonText}>Stop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.recordButton, styles.cancelButton]} onPress={cancelRecording}>
                    <Text style={styles.recordButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search by title or date..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.divider} />

          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>My Recordings ({filteredNotes.length})</Text>
              <TouchableOpacity onPress={loadVoiceNotes} disabled={isLoadingNotes}>
                <Text style={styles.refreshButton}>{isLoadingNotes ? 'Loading...' : 'Refresh'}</Text>
              </TouchableOpacity>
            </View>

            {isLoadingNotes ? (
              <ActivityIndicator size="large" color="#00d4ff" />
            ) : filteredNotes.length === 0 ? (
              <Text style={styles.emptyStateText}>
                {search ? 'No results found' : 'No recordings yet. Tap above to start!'}
              </Text>
            ) : (
              <FlatList
                data={filteredNotes}
                renderItem={renderVoiceNote}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { fontSize: 34, fontWeight: 'bold', color: '#00d4ff', textAlign: 'center', marginTop: 50, marginBottom: 20 },
  permissionContainer: { alignItems: 'center', marginTop: 100 },
  statusText: { fontSize: 18, color: '#666', marginBottom: 20 },
  button: { backgroundColor: '#00d4ff', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  recordingSection: { alignItems: 'center', padding: 20 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  recordingDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#ff3b30', marginRight: 10 },
  recordingText: { fontSize: 20, color: '#ff3b30', fontWeight: 'bold' },
  durationText: { fontSize: 56, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  titleInput: { backgroundColor: '#222', color: '#fff', width: '90%', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 18 },
  search: { backgroundColor: '#222', color: '#fff', margin: 20, padding: 15, borderRadius: 12, fontSize: 16 },
  buttonContainer: { flexDirection: 'row', gap: 20, marginTop: 20 },
  recordButton: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 30, minWidth: 160 },
  startButton: { backgroundColor: '#00d4ff' },
  stopButton: { backgroundColor: '#34c759' },
  cancelButton: { backgroundColor: '#ff3b30' },
  recordButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 20 },
  listSection: { flex: 1, paddingHorizontal: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listTitle: { fontSize: 22, fontWeight: 'bold', color: '#00d4ff' },
  refreshButton: { fontSize: 18, color: '#00d4ff' },
  listContent: { paddingBottom: 20 },
  emptyStateText: { fontSize: 18, color: '#666', textAlign: 'center', marginTop: 50 },
  noteCard: { backgroundColor: '#111', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  noteHeader: { marginBottom: 10 },
  noteTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  noteDate: { fontSize: 14, color: '#888', marginTop: 4 },
  noteControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  noteDuration: { fontSize: 16, color: '#00d4ff', fontWeight: '600' },
  noteButtons: { flexDirection: 'row', gap: 15 },
  iconButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  playingButton: { backgroundColor: '#ff9500' },
  deleteButton: { backgroundColor: '#ff3b30', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  iconButtonText: { fontSize: 24 },
});