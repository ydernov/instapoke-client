import type { Pokemon } from "@/api";
import {
  cssOptimizationAtom,
  feedItemMovesDelayedRenderingAtom,
} from "@/components/control-panel";
import { ImageComponent } from "@/components/image";
import { cn } from "@/utils";
import { useAtomValue } from "jotai";
import { memo, useEffect, useState } from "react";
import image404 from "./404_image.webp";
import missingImg from "./missing_image.webp";
import { TagLinksSectionHOC } from "./tag-links-hoc";

const FeedItem: React.FC<Pokemon> = ({
  name,
  imageURL,
  smallImageURL,
  types,
  abilities,
  moves,
}) => {
  const cssOptimization = useAtomValue(cssOptimizationAtom);
  const useDalayedRendering = useAtomValue(feedItemMovesDelayedRenderingAtom);
  const [showLargeArray, setShowLargeArray] = useState(!useDalayedRendering);

  useEffect(() => {
    if (useDalayedRendering) {
      if ("requestIdleCallback" in window) {
        const _id = requestIdleCallback(() => {
          setShowLargeArray(true);
        });
        return () => cancelIdleCallback(_id);
      } else {
        const _id = setTimeout(() => {
          setShowLargeArray(true);
        }, 400);
        return () => clearTimeout(_id);
      }
    }
  }, [useDalayedRendering]);

  return (
    <article
      className={cn(
        "bg-white border border-gray-200 rounded-xl shadow-lg",
        "p-6 flex flex-row items-start gap-4",
        cssOptimization === "content-visibility"
          ? "[content-visibility:auto] [contain-intrinsic-size:1px_475px]"
          : ""
      )}
    >
      <ImageComponent
        src={imageURL || missingImg}
        previewSrc={smallImageURL || undefined}
        width={475}
        height={475}
        alt={name}
        className="rounded-lg flex-shrink-0"
        errorImgSrc={image404}
      />

      <div className="flex flex-col justify-between aspect-square overflow-hidden min-h-full">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>

        <TagLinksSectionHOC tagType="types" tags={types} title="Types:" />

        <TagLinksSectionHOC
          tagType="abilities"
          tags={abilities}
          title="Abilities:"
        />

        {showLargeArray ? (
          <TagLinksSectionHOC tagType="moves" tags={moves} title="Moves:" />
        ) : (
          <div className="grow-1">Loading moves...</div>
        )}
      </div>
    </article>
  );
};

export const FeedItemMomoized = memo(FeedItem);
export default FeedItem;
