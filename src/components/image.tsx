import type { JSX } from "react";

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
  return (
    <img
      ref={(ref) => {
        if (previewSrc) {
          ref?.style.setProperty("--img-url", `url(${previewSrc})`);
        }
      }}
      className={`${previewSrc ? "[background-image:var(--img-url)]" : ""} bg-no-repeat bg-contain object-contain ${className}`}
      src={src}
      alt={alt}
      onError={(e) => {
        if (errorImgSrc) {
          e.currentTarget.src = errorImgSrc;
        } else {
          e.currentTarget.src = `https://placehold.co/${width || "400"}x${height || "400"}/CCCCCC/666666?text=Image+Error`;
        }
      }}
      width={width}
      height={height}
    />
  );
};
