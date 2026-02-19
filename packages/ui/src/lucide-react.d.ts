import type { ComponentType, SVGProps, RefAttributes } from "react";

declare module "lucide-react" {
  export type LucideIcon = ComponentType<
    SVGProps<SVGSVGElement> &
      RefAttributes<SVGSVGElement> & {
        size?: string | number;
        absoluteStrokeWidth?: boolean;
      }
  >;
}
