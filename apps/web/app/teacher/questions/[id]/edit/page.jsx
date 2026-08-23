import { QuestionEditor } from '../../../../moderator/questions/create/page';

export default async function EditTeacherQuestion({ params }) {
  const { id } = await params;
  return <QuestionEditor questionId={id} basePath="/teacher/questions" />;
}
