import { feedItemMemoizationAtom } from "@/components/control-panel";
import { useAtomValue } from "jotai";
import { type ComponentProps } from "react";
import FeedItem, { FeedItemMomoized } from "./feed-item";

type FeedItemProps = ComponentProps<typeof FeedItem>;

export const FeedItemHOC = (props: FeedItemProps) => {
  const mem = useAtomValue(feedItemMemoizationAtom);

  return mem ? <FeedItemMomoized {...props} /> : <FeedItem {...props} />;
};
