'use client';
import { useParams } from 'next/navigation';
import { QuestionEditor } from '@/components/question-editor';

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  return <QuestionEditor id={id} />;
}
