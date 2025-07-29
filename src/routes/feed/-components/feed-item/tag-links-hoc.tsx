import { feedItemTagsMemoizationAtom } from "@/components/control-panel";
import { useAtomValue } from "jotai";
import { type ComponentProps } from "react";
import TagLinksSection, { TagLinksSectionMomoized } from "./tag-links";

type SectionProps = ComponentProps<typeof TagLinksSection>;

export const TagLinksSectionHOC = (props: SectionProps) => {
  const mem = useAtomValue(feedItemTagsMemoizationAtom);

  return mem ? (
    <TagLinksSectionMomoized {...props} />
  ) : (
    <TagLinksSection {...props} />
  );
};
