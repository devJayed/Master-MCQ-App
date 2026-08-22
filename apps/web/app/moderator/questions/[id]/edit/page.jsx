import { QuestionEditor } from '../../create/page';

export default async function EditQuestion({ params }) {
  const { id } = await params;
  return <QuestionEditor questionId={id} />;
}
