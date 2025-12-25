export interface MediaStreamConfig {
  websocketUrl: string;
  onTranscript: (text: string, speaker: "agent" | "customer", isFinal: boolean) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

type TranscriptPayload = {
  text?: string;
  transcript?: string;
  speaker?: "agent" | "customer";
  isFinal?: boolean;
  final?: boolean;
};

const TRANSCRIPTION_WS_URL = "ws://100.66.42.81:4097/stream";
const MULAW_BIAS = 0x84;
const SIGN_BIT = 0x80;
const QUANT_MASK = 0x0f;
const SEG_MASK = 0x70;
const SEG_SHIFT = 4;

export class MediaStreamHandler {
  private ws: WebSocket | null = null;
  private transcriptionWs: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private config: MediaStreamConfig | null = null;

  connect(config: MediaStreamConfig): void {
    this.config = config;

    if (this.ws || this.transcriptionWs) {
      this.disconnect();
    }

    this.ws = new WebSocket(config.websocketUrl);
    this.ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      this.handleMediaMessage(event.data);
    };
    this.ws.onerror = () => {
      this.config?.onError(new Error("Media stream websocket error"));
    };
    this.ws.onclose = () => {
      this.config?.onClose();
      this.ws = null;
    };

    this.transcriptionWs = new WebSocket(TRANSCRIPTION_WS_URL);
    this.transcriptionWs.binaryType = "arraybuffer";
    this.transcriptionWs.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      this.handleTranscriptMessage(event.data);
    };
    this.transcriptionWs.onerror = () => {
      this.config?.onError(new Error("Transcription websocket error"));
    };
    this.transcriptionWs.onclose = () => {
      this.config?.onClose();
      this.transcriptionWs = null;
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.transcriptionWs) {
      this.transcriptionWs.close();
      this.transcriptionWs = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  private handleMediaMessage(raw: string): void {
    try {
      const message = JSON.parse(raw);
      if (message.event !== "media" || !message.media?.payload) return;

      const mulawBytes = this.base64ToUint8(message.media.payload as string);
      const pcm = this.decodeMuLaw(mulawBytes);

      if (this.transcriptionWs?.readyState === WebSocket.OPEN) {
        const pcmBase64 = this.uint8ToBase64(new Uint8Array(pcm.buffer));
        this.transcriptionWs.send(
          JSON.stringify({
            type: "audio",
            audio: pcmBase64,
            sampleRate: 8000,
            encoding: "pcm_s16le",
          })
        );
      }
    } catch (error) {
      this.config?.onError(error instanceof Error ? error : new Error("Failed to parse media message"));
    }
  }

  private handleTranscriptMessage(raw: string): void {
    try {
      const payload = JSON.parse(raw) as TranscriptPayload;
      const text = payload.text || payload.transcript;
      if (!text) return;

      const speaker = payload.speaker === "agent" ? "agent" : "customer";
      const isFinal = Boolean(payload.isFinal ?? payload.final);
      this.config?.onTranscript(text, speaker, isFinal);
    } catch (error) {
      this.config?.onError(error instanceof Error ? error : new Error("Failed to parse transcript message"));
    }
  }

  private base64ToUint8(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private uint8ToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decodeMuLaw(input: Uint8Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] = this.muLawToPcm(input[i]);
    }
    return output;
  }

  private muLawToPcm(sample: number): number {
    let u = (~sample) & 0xff;
    let t = ((u & QUANT_MASK) << 3) + MULAW_BIAS;
    t <<= (u & SEG_MASK) >> SEG_SHIFT;
    return (u & SIGN_BIT) ? (MULAW_BIAS - t) : (t - MULAW_BIAS);
  }
}
