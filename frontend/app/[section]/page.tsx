import { SectionView } from "@/components/SectionView";
import { Shell } from "@/components/Shell";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <Shell><SectionView section={section} /></Shell>;
}
