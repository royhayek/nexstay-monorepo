import { ReviewDetailsView } from 'src/sections/review/view';

// ----------------------------------------------------------------------

export interface ReviewDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailsPage(props: ReviewDetailsPageProps) {
  const { id } = await props.params;

  return <ReviewDetailsView id={id} />;
}