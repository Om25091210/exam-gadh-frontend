'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Button, Card, Field, PageHeader, Textarea } from '@eg/ui';
import { ImagePlus, Paperclip, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { VoiceRecorder } from '@/components/voice-recorder';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import { uploadToS3 } from '@/lib/upload';

interface Attachment {
  key: string;
  name: string;
  kind: 'image' | 'audio';
}
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function NewDoubtInner() {
  const { t, b } = useI18n();
  const api = useApi();
  const router = useRouter();
  const sp = useSearchParams();
  const ctx = sp.get('context');
  const contextType = ctx === 'question' || ctx === 'current_affair' || ctx === 'note' ? ctx : 'free';
  const contextId = contextType === 'free' ? undefined : (sp.get('id') ?? undefined);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [debounced, setDebounced] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(text.trim()), 500);
    return () => clearTimeout(id);
  }, [text]);
  const similar = useQuery({ queryKey: ['similar', debounced], queryFn: () => api.similarFaqs(debounced), enabled: debounced.length >= 3 });

  const upload = async (blob: Blob, contentType: string, name: string, kind: Attachment['kind']) => {
    setUploading(true);
    setUploadError(false);
    try {
      const post = await api.doubtUpload({ purpose: kind === 'image' ? 'doubt-image' : 'doubt-audio', contentType });
      await uploadToS3(post, blob);
      setFiles((f) => [...f, { key: post.key, name, kind }]);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const send = useMutation({
    mutationFn: () => api.createDoubt({ contextType, contextId, text: text.trim(), attachmentKeys: files.map((f) => f.key) }),
    onSuccess: (r) => router.replace(`/doubts/${r.id}`),
  });

  return (
    <>
      <PageHeader title={t('doubts.new')} subtitle={t('doubts.text.hint')} />
      <Card className="space-y-4">
        <Field label={t('doubts.text')}>{(p) => <Textarea {...p} rows={6} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />}</Field>

        {similar.data && similar.data.length > 0 ? (
          <section aria-label={t('doubts.similar')} className="rounded-xl bg-primary-50 p-3">
            <p className="mb-2 font-semibold text-primary-800">{t('doubts.similar')}</p>
            <ul className="space-y-2">
              {similar.data.map((f) => (
                <li key={f.id}><details><summary className="cursor-pointer font-medium">{b(f.qEn, f.qHi)}</summary><p className="mt-1 text-ink-700">{b(f.aEn, f.aHi)}</p></details></li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap items-start gap-2">
          <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" tabIndex={-1} onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f && IMAGE_TYPES.includes(f.type)) void upload(f, f.type, f.name, 'image');
            else if (f) setUploadError(true);
          }} />
          <Button type="button" variant="secondary" size="sm" disabled={uploading || files.length >= 3} onClick={() => fileInput.current?.click()}><ImagePlus className="size-4" aria-hidden />{t('doubts.photo')}</Button>
          <VoiceRecorder disabled={uploading || files.length >= 3} onRecorded={(blob, type) => void upload(blob, type, 'voice', 'audio')} />
        </div>
        {uploading ? <p role="status" className="text-sm text-ink-500">{t('doubts.attachment.uploading')}</p> : null}
        {uploadError ? <Alert tone="danger">{t('doubts.attachment.failed')}</Alert> : null}
        {files.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {files.map((f) => (
              <li key={f.key} className="flex items-center gap-1 rounded-full border border-line bg-surface py-1 pl-3 pr-1 text-sm">
                <Paperclip className="size-4" aria-hidden />{f.kind === 'image' ? f.name : t('doubts.voice.start')}
                <button type="button" aria-label={t('doubts.attachment.remove')} onClick={() => setFiles((x) => x.filter((y) => y.key !== f.key))} className="grid size-7 place-items-center rounded-full hover:bg-black/5"><X className="size-4" aria-hidden /></button>
              </li>
            ))}
          </ul>
        ) : null}

        {send.isError ? <Alert tone="danger">{t(errorKey(send.error))}</Alert> : null}
        <Button size="lg" className="w-full sm:w-auto" disabled={text.trim().length < 5 || uploading} loading={send.isPending} onClick={() => send.mutate()}>{t('doubts.send')}</Button>
      </Card>
    </>
  );
}

export default function NewDoubtPage() {
  return (
    <Suspense>
      <NewDoubtInner />
    </Suspense>
  );
}
