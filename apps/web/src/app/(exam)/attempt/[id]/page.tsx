'use client';
import { useParams } from 'next/navigation';
import { ExamHall } from '@/components/exam/exam-hall';

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  return <ExamHall attemptId={id} />;
}
