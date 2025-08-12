import type { PickKeys } from "@/type-utils";
import { Link } from "@tanstack/react-router";
import type { FeedSearchParams } from "../..";
import { memo } from "react";

type TagLinksSectionProps = {
  tags: string[];
  tagType: PickKeys<FeedSearchParams, "moves" | "abilities" | "types">;
  title: string;
};

const tagLinksSectionClasses: Record<
  TagLinksSectionProps["tagType"],
  {
    sectionClassName: string;
    tagClassName: string;
  }
> = {
  types: {
    sectionClassName: "shrink-0",
    tagClassName: "bg-blue-200 text-blue-900",
  },
  abilities: {
    sectionClassName: "shrink-0",
    tagClassName: "bg-green-200 text-green-900",
  },
  moves: {
    sectionClassName: "content-start grow-1 overscroll-contain",
    tagClassName: "bg-purple-200 text-purple-900",
  },
};

const TagLinksSection: React.FC<TagLinksSectionProps> = ({
  tags,
  title,
  tagType,
}) => {
  const { sectionClassName, tagClassName } = tagLinksSectionClasses[tagType];

  return (
    <section
      className={`flex flex-wrap gap-2 mb-2 overflow-auto ${sectionClassName} `}
    >
      <span className="text-sm font-semibold text-gray-700 mr-1">{title}</span>
      {tags.map((tag) => (
        <Link
          to="/feed"
          search={(search) => {
            return {
              ...search,
              [tagType]: [tag],
            };
          }}
          key={tag}
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tagClassName}`}
        >
          {tag}
        </Link>
      ))}
    </section>
  );
};

export const TagLinksSectionMomoized = memo(TagLinksSection);
export default TagLinksSection;
