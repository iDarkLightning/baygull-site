import { createFileRoute, Link } from "@tanstack/react-router";
import { CollapsedHeader } from "~/components/layout/nav";

const SOCIAL_LINKS = [
  {
    name: "SBEngaged",
    link: "https://stonybrook.campuslabs.com/engage/organization/thebaygull",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
        <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
        <path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727" />
        <path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    link: "https://www.instagram.com/sbubaygull",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        <path d="M16.5 7.5v.01" />
      </svg>
    ),
  },
  {
    name: "Discord",
    link: "https://discord.gg/tSpzFqy22j",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
        <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" />
        <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c.667 -1.667 .5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-.972 1.923a11.913 11.913 0 0 0 -4.053 0l-.975 -1.923c-1.5 .16 -3.043 .485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c.667 1.333 2 3 3.5 3c.5 0 2 -2 2 -3" />
        <path d="M7 16.5c3.5 1 6.5 1 10 0" />
      </svg>
    ),
  },
];
const RESOURCES = [
  {
    name: "Editing/Art Interest Form",
    link: "https://forms.gle/3MrFUiswdM124v7g6",
    logo: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" />
        <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      </svg>
    ),
  },
];

export const Route = createFileRoute("/links")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <CollapsedHeader />
      <div className="max-w-[100rem] py-6 px-4 md:mx-auto mt-16 md:w-[80%] lg:w-[85%] 2xl:w-[90%] flex items-center justify-center">
        <main className="min-h-[calc(100vh-16vh)] bg-orange-50/70 p-8 rounded-lg border-zinc-300/70 border-[0.0125rem] shadow-inner flex flex-col justify-center font-serif gap-4">
          <div>
            <h2 className="text-3xl font-black text-neutral-700 tracking-wide">
              Quick Links
            </h2>
            <p className="text-neutral-700">
              A hub where you can find links to various Bay Gull happenings
            </p>
          </div>
          <div className="flex justify-between gap-4 flex-col lg:flex-row">
            {SOCIAL_LINKS.map((link) => (
              <Link
                to={link.link}
                className="bg-white p-4 rounded-lg w-full text-center border border-orange-200 shadow-xs flex gap-2 justify-center"
              >
                {link.logo}
                <p className="hover:underline">{link.name}</p>
              </Link>
            ))}
          </div>
          {RESOURCES.map((link) => (
            <Link
              to={link.link}
              className="p-4 bg-white rounded-lg border border-orange-200 text-center flex gap-2 justify-center"
            >
              {link.logo}
              <p className="hover:underline">{link.name}</p>
            </Link>
          ))}
        </main>
      </div>
    </>
  );
}
