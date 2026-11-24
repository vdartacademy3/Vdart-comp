export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported by your browser or environment.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/wav';

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // collect chunks every 250ms
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission was denied. Please allow microphone access in your Windows / system settings.');
      }
      throw new Error(`Failed to access microphone: ${err.message || 'Unknown error'}`);
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording found.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Stop all audio tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];

        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (e) => {
        reject(e);
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

export async function transcribeAudioWithGroq(
  audioBlob: Blob,
  apiKey: string,
  model = 'whisper-large-v3-turbo'
): Promise<TranscriptionResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Groq API Key is required for speech-to-text transcription. Please configure your key in Settings.');
  }

  if (audioBlob.size < 100) {
    throw new Error('Recorded audio is too short or empty. Please speak clearly into the microphone.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', model);
  formData.append('response_format', 'verbose_json');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = `Transcription API error (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.error && errJson.error.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
      text: (data.text || '').trim(),
      language: data.language,
      duration: data.duration,
    };
  } catch (err: any) {
    console.error('Groq transcription error:', err);
    throw err;
  }
}
