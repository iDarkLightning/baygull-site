import { cn } from "@baygull/ui/cn";
import { BaseImagePlugin } from "@platejs/media";
import type {
  SlateElementProps,
  TCaptionProps,
  TImageElement,
  TResizableProps,
} from "platejs";
import { BaseCaptionPlugin } from "@platejs/caption";

import { KEYS, NodeApi, SlateElement } from "platejs";

type Props = SlateElementProps<TImageElement & TCaptionProps & TResizableProps>;

const StaticImageElement: React.FC<Props> = (props) => {
  const { align = "center", caption, url, width } = props.element;

  return (
    <SlateElement {...props} className="py-2.5">
      <figure className="group relative m-0 inline-block" style={{ width }}>
        <div className="relative max-w-full" style={{ textAlign: align }}>
          <img
            referrerPolicy="no-referrer"
            className={cn("w-full max-w-full block object-cover rounded-md")}
            alt={(props.attributes as any).alt}
            src={url}
          />
          {caption && caption[0] && (
            <figcaption className="mx-auto mt-2 h-[24px] max-w-full">
              {NodeApi.string(caption[0])}
            </figcaption>
          )}
        </div>
      </figure>
      {props.children}
    </SlateElement>
  );
};

export const StaticMediaKit = [
  BaseImagePlugin.withComponent(StaticImageElement),
  BaseCaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img],
      },
    },
  }),
];
