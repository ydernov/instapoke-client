import type { Pokemon } from "@/api";
import { ImageComponent } from "@/components/image";
import type { PickKeys } from "@/type-utils";
import { Link } from "@tanstack/react-router";
import { type FeedSearchParams } from "..";
import image404 from "./404_image.webp";
import missingImg from "./missing_image.webp";

const FeedItem: React.FC<Pokemon> = ({
  name,
  imageURL,
  smallImageURL,
  types,
  abilities,
  moves,
}) => {
  return (
    <article className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-row items-start gap-4">
      <ImageComponent
        src={imageURL || missingImg}
        previewSrc={smallImageURL || undefined}
        width={475}
        height={475}
        alt={name}
        className={"rounded-lg flex-shrink-0"}
        errorImgSrc={image404}
      />

      <div className="flex flex-col justify-between aspect-square overflow-hidden min-h-full">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>

        <TagLinksSection tagType="types" tags={types} title="Types:" />

        <TagLinksSection
          tagType="abilities"
          tags={abilities}
          title="Abilities:"
        />

        <TagLinksSection tagType="moves" tags={moves} title="Moves:" />
      </div>
    </article>
  );
};

export default FeedItem;

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
      className={`flex flex-wrap gap-2 mb-2 overflow-auto ${sectionClassName}`}
    >
      <span className="text-sm font-semibold text-gray-700 mr-1">{title}</span>
      {tags.map((tag) => (
        <Link
          to="/feed"
          search={{
            [tagType]: [tag],
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
