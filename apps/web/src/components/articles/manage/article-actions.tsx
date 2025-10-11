import { MenuTrigger, Menu } from "@baygull/ui/aria";
import { Button } from "@baygull/ui/button";
import useWindowSize from "@baygull/ui/hooks/use-window-size";
import {
  PublishIcon,
  ChevronDownIcon,
  ThreeDotsIcon,
  ExternalLinkIcon,
} from "@baygull/ui/icons";
import { MenuItem } from "@baygull/ui/menu";
import { ModalPopover } from "@baygull/ui/modal-popover";
import { Link } from "@tanstack/react-router";
import { useDraft } from "~/lib/articles/use-draft";

export const ArticleActions = () => {
  const { data } = useDraft();
  const { loading, windowSize } = useWindowSize();
  const isCollapsed = loading || (windowSize.width && windowSize?.width < 768);

  return (
    <div className="flex">
      {!isCollapsed && (
        <>
          {data.status === "published" ? (
            <Link
              to="/articles/$slug"
              params={{ slug: data.slug }}
              target="_blank"
            >
              <Button leadingVisual={<ExternalLinkIcon />} isCircular="left">
                Visit
              </Button>
            </Link>
          ) : (
            <Button leadingVisual={<PublishIcon />} isCircular="left">
              Publish
            </Button>
          )}
        </>
      )}
      <MenuTrigger>
        <Button
          variant="primary"
          size="icon"
          isCircular={isCollapsed ? false : "right"}
        >
          {isCollapsed ? <ThreeDotsIcon /> : <ChevronDownIcon />}
        </Button>
        <ModalPopover
          popoverProps={{
            placement: "bottom right",
          }}
        >
          <Menu className="focus:outline-none min-w-42">
            {isCollapsed && <MenuItem>Publish</MenuItem>}
            <MenuItem>Preview</MenuItem>
            <MenuItem>Archive</MenuItem>
            <MenuItem>Delete</MenuItem>
          </Menu>
        </ModalPopover>
      </MenuTrigger>
    </div>
  );
};
