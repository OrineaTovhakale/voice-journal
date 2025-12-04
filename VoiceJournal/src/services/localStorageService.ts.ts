// src/services/localStorageService.ts  ← rename the file to this too!
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceNote } from '../types';

const NOTES_KEY = '@voice_notes';

export const saveNoteLocally = async (note: VoiceNote): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(NOTES_KEY);
    const notes = existing ? JSON.parse(existing) : [];
    notes.unshift(note); // newest first
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save note', e);
  }
};

export const loadNotesLocally = async (): Promise<VoiceNote[]> => {
  try {
    const data = await AsyncStorage.getItem(NOTES_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Convert string dates back to Date objects
    return parsed.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }));
  } catch (e) {
    console.error('Failed to load notes', e);
    return [];
  }
};

export const deleteNoteLocally = async (id: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(NOTES_KEY);
    if (!existing) return;
    const notes = JSON.parse(existing);
    const filtered = notes.filter((n: any) => n.id !== id);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete note', e);
  }
};