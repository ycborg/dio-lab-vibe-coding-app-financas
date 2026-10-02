import type { SVGProps } from 'react';

/** Ícones de traço fino (1.6px), herdam a cor via currentColor. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(paths: React.ReactNode) {
  return function Icon({ size = 18, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {paths}
      </svg>
    );
  };
}

export const IconOverview = make(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>);
export const IconList = make(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>);
export const IconCalendar = make(<><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>);
export const IconPie = make(<><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>);
export const IconChat = make(<><path d="M20 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 12.5h5" /></>);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconSearch = make(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const IconDownload = make(<><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 19h16" /></>);
export const IconEdit = make(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>);
export const IconTrash = make(<><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" /></>);
export const IconClose = make(<path d="M6 6l12 12M18 6L6 18" />);
export const IconChevronLeft = make(<path d="M15 5l-7 7 7 7" />);
export const IconChevronRight = make(<path d="M9 5l7 7-7 7" />);
export const IconChevronDown = make(<path d="M6 9l6 6 6-6" />);
export const IconSend = make(<><path d="M21 3L10 14" /><path d="M21 3l-7 18-4-7-7-4z" /></>);
export const IconCheck = make(<path d="M5 12.5l4.5 4.5L19 7" />);
export const IconArrowUp = make(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IconArrowDown = make(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IconScale = make(<><path d="M12 3v18M5 7h14" /><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" /></>);
