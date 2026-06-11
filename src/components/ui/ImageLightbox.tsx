import * as React from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

interface ImageLightboxProps {
  open: boolean;
  close: () => void;
  images: string[];
  index?: number;
}

export function ImageLightbox({ open, close, images, index = 0 }: ImageLightboxProps) {
  const slides = images.map((src) => ({ src }));

  return (
    <Lightbox
      open={open}
      close={close}
      index={index}
      slides={slides}
      plugins={[Zoom, Thumbnails, Counter, Fullscreen, Slideshow]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      thumbnails={{
        position: "bottom",
        width: 120,
        height: 80,
        border: 2,
        gap: 10,
        padding: 4,
        borderRadius: 8,
        showToggle: true,
      }}
      counter={{ container: { style: { top: "unset", bottom: "110px" } } }}
      slideshow={{ autoplay: false, delay: 3000 }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, .95)" },
        thumbnail: { borderRadius: "8px" },
      }}
      animation={{ fade: 300, swipe: 500 }}
      carousel={{
        finite: slides.length <= 1,
        preload: 2,
        padding: "16px",
        spacing: "10%",
      }}
    />
  );
}
