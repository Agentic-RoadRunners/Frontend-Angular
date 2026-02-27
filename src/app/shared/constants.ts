export interface CategoryStyle {
  icon: string;
  color: string;
  label: string;
}

export const CATEGORY_STYLES: Record<number, CategoryStyle> = {
  1:  { icon: 'fa-car-burst',           color: '#ef4444', label: 'Traffic Accident' },
  2:  { icon: 'fa-circle-exclamation',  color: '#f97316', label: 'Pothole' },
  3:  { icon: 'fa-road-barrier',        color: '#eab308', label: 'Road Damage' },
  4:  { icon: 'fa-water',              color: '#3b82f6', label: 'Flooding' },
  5:  { icon: 'fa-sign-hanging',       color: '#8b5cf6', label: 'Broken Sign' },
  6:  { icon: 'fa-tree',               color: '#22c55e', label: 'Fallen Tree' },
  7:  { icon: 'fa-lightbulb',          color: '#facc15', label: 'Street Light Out' },
  8:  { icon: 'fa-helmet-safety',      color: '#f59e0b', label: 'Construction' },
  9:  { icon: 'fa-traffic-light',      color: '#64748b', label: 'Traffic Jam' },
  10: { icon: 'fa-snowflake',          color: '#7dd3fc', label: 'Ice / Snow' },
  11: { icon: 'fa-paw',               color: '#a78bfa', label: 'Animal on Road' },
};

export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: 'fa-triangle-exclamation',
  color: '#94a3b8',
  label: 'Unknown',
};

/** Helper: get style for a category id, with fallback */
export function getCategoryStyle(categoryId: number): CategoryStyle {
  return CATEGORY_STYLES[categoryId] ?? DEFAULT_CATEGORY_STYLE;
}

/** Helper: get style by category label string (used when only categoryName is available) */
export function getCategoryStyleByName(name: string): CategoryStyle {
  const found = Object.values(CATEGORY_STYLES).find(
    (s) => s.label.toLowerCase() === name.toLowerCase(),
  );
  return found ?? DEFAULT_CATEGORY_STYLE;
}