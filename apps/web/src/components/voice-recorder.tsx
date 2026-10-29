'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Button } from '@eg/ui';
import { Mic, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 120;
const TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg'];

/** Records up to two minutes of audio in the browser. The recording is handed back as a Blob; nothing is sent until the student submits. */
export function VoiceRecorder({ onRecorded, disabled }: { onRecorded: (blob: Blob, contentType: string) => void; disabled?: boolean }) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [denied, setDenied] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

  const stop = () => {
    if (rec.current?.state === 'recording') rec.current.stop();
    if (timer.current) clearInterval(timer.current);
    setRecording(false);
  };
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    if (rec.current?.state === 'recording') rec.current.stop();
  }, []);

  const start = async () => {
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = TYPES.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop()); // release the microphone
        const type = (r.mimeType || mime || 'audio/webm').split(';')[0];
        if (chunks.length) onRecorded(new Blob(chunks, { type }), type);
      };
      r.start();
      rec.current = r;
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((s) => { if (s + 1 >= MAX_SECONDS) stop(); return s + 1; }), 1000);
    } catch {
      setDenied(true);
    }
  };

  if (!supported) return null;
  return (
    <div className="space-y-2">
      <Button type="button" variant={recording ? 'danger' : 'secondary'} size="sm" disabled={disabled} onClick={recording ? stop : () => void start()}>
        {recording ? <Square className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
        {recording ? `${t('doubts.voice.stop')} (${seconds}s)` : t('doubts.voice.start')}
      </Button>
      {denied ? <Alert tone="warning">{t('doubts.voice.denied')}</Alert> : null}
    </div>
  );
}
