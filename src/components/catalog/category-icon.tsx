import type { IconProps } from "@phosphor-icons/react";
import {
  DeviceMobileIcon,
  DeviceTabletIcon,
  HeadphonesIcon,
  LaptopIcon,
  TelevisionIcon,
  WashingMachineIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";

const icons: Record<string, ComponentType<IconProps>> = {
  smartphone: DeviceMobileIcon,
  laptop: LaptopIcon,
  tablet: DeviceTabletIcon,
  tv: TelevisionIcon,
  audio: HeadphonesIcon,
  appliance: WashingMachineIcon,
};

export function CategoryIcon({ icon, ...props }: { icon: string } & IconProps) {
  const Icon = icons[icon] ?? WashingMachineIcon;
  return <Icon aria-hidden {...props} />;
}
