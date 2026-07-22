type IconName =
  | 'upload'
  | 'undo'
  | 'redo'
  | 'duplicate'
  | 'delete'
  | 'rotate'
  | 'download'
  | 'shield'
  | 'image';

const paths: Record<IconName, string> = {
  upload: 'M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4',
  undo: 'M9 7H5v-4M5.5 7.5A8 8 0 1 1 5 15',
  redo: 'M15 7h4v-4m-.5 4.5A8 8 0 1 0 19 15',
  duplicate: 'M8 8h11v11H8zM5 16V5h11',
  delete: 'M4 7h16M9 11v5m6-5v5M7 7l1 13h8l1-13M9 7V4h6v3',
  rotate: 'M17 7V3l4 4-4 4V7a7 7 0 1 0 1.6 9.4',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 19h14',
  shield: 'M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3zm-3 9 2 2 4-5',
  image: 'M4 5h16v14H4zM7 15l3-3 2 2 2-2 3 3M8 9h.01',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
