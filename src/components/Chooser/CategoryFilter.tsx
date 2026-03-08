import { EVENT_TYPES } from "@/lib/types";
import CategoryIcon from "@/components/CategoryIcon";
import styles from "@/styles/Chooser.module.css";

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className={styles.categoryChips}>
      {EVENT_TYPES.map((type) => (
        <button
          key={type}
          className={`${styles.categoryChip}${selected === type ? ` ${styles.categoryChipActive}` : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(selected === type ? null : type);
          }}
          aria-pressed={selected === type}
          title={capitalize(type)}
        >
          <CategoryIcon type={type} size={16} />
          <span>{capitalize(type)}</span>
        </button>
      ))}
    </div>
  );
}
