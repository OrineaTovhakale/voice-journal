export interface VoiceNote {
  id: string;
  title: string;
  uri: string;
  duration: number;
  createdAt: Date;
  firebaseUrl?: string;
  fileName?: string;
  docId?: string;
  isUploading?: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
}