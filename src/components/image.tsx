import { cn } from "@/utils";
import { useRef, useState, type JSX } from "react";

type IntrinsicImgProps = JSX.IntrinsicElements["img"];

type Props = {
  width?: IntrinsicImgProps["width"];
  height?: IntrinsicImgProps["height"];
  alt?: IntrinsicImgProps["alt"];
  className?: IntrinsicImgProps["className"];

  src: IntrinsicImgProps["src"];
  previewSrc?: IntrinsicImgProps["src"];
  errorImgSrc?: IntrinsicImgProps["src"];
};

export const ImageComponent = ({
  width,
  height,
  alt,
  src,
  previewSrc,
  errorImgSrc,
  className,
}: Props) => {
  const errorSrc = useRef<"provided" | "fallback" | "none" | "disabled">(
    "none"
  );
  const [applyErrorClass, setApplyErrorClass] = useState(false);
  const twClasses =
    "after:content-['IMAGE_NOT_AVAILABLE'] after:flex after:items-center after:justify-center after:absolute after:inset-0 after:bg-gray-200 after:text-gray-700";
  const fallbackErrorImgSrc = `https://placehold.co/${width || "400"}x${height || "400"}/CCCCCC/666666?text=Image+Error`;
  return (
    <img
      ref={(ref) => {
        if (previewSrc) {
          ref?.style.setProperty("--img-url", `url(${previewSrc})`);
        }
      }}
      className={cn(
        previewSrc ? "[background-image:var(--img-url)]" : "",
        "bg-no-repeat bg-contain object-contain overflow-clip relative",
        applyErrorClass ? twClasses : "",
        className
      )}
      src={src}
      alt={alt}
      onError={(e) => {
        if (!applyErrorClass) {
          if (errorImgSrc && errorSrc.current === "none") {
            e.currentTarget.src = errorImgSrc;
            errorSrc.current = "provided";
          } else if (errorSrc.current === "provided") {
            e.currentTarget.src = fallbackErrorImgSrc;
            errorSrc.current = "fallback";
          } else if (errorSrc.current === "fallback") {
            errorSrc.current = "disabled";
            e.currentTarget.src = "";
            setApplyErrorClass(true);
          }
        }
      }}
      width={width}
      height={height}
    />
  );
};
