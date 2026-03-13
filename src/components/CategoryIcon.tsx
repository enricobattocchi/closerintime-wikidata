import type { SVGProps } from "react";
import {
  AccountBalance, MusicNote, Movie, Domain, MenuBook,
  ScienceIcon, PaletteIcon, MemoryIcon, SportsSoccer,
  LiveTv, PersonIcon, PlaceIcon, GroupIcon, WarningIcon,
  MilitaryIcon, FlightIcon, EventIcon,
} from "@/components/Icon";

type IconComponent = (props: SVGProps<SVGSVGElement> & { size?: number }) => React.JSX.Element;

const iconMap: Record<string, IconComponent> = {
  history: AccountBalance,
  music: MusicNote,
  film: Movie,
  building: Domain,
  book: MenuBook,
  science: ScienceIcon,
  art: PaletteIcon,
  computer: MemoryIcon,
  sport: SportsSoccer,
  "pop culture": LiveTv,
  person: PersonIcon,
  place: PlaceIcon,
  organization: GroupIcon,
  position: AccountBalance,
  disaster: WarningIcon,
  military: MilitaryIcon,
  transport: FlightIcon,
};

export default function CategoryIcon({
  type,
  size,
  ...props
}: { type: string; size?: number } & SVGProps<SVGSVGElement>) {
  const Icon = iconMap[type] || EventIcon;
  return <Icon size={size} {...props} />;
}
