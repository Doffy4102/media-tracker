import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import { annotateLibrary, getRecentItems, getShowcase } from "@/lib/showcase";
import Showcase from "@/components/showcase/Showcase";
import ShowcaseSkeleton from "@/components/showcase/ShowcaseSkeleton";

async function ShowcaseContent() {
  const data = await getShowcase();
  const session = await verifySession();
  if (session) {
    await annotateLibrary(data, session.userId);
    data.recent = await getRecentItems(session.userId);
  }
  return <Showcase data={data} isAuthed={Boolean(session)} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<ShowcaseSkeleton />}>
      <ShowcaseContent />
    </Suspense>
  );
}
