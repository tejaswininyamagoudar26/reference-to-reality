import { Plus } from "lucide-react";
import doctorAvatar from "@/assets/doctor-avatar.jpg";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-10", badge: "size-4 -right-0.5 -bottom-0.5 [&_svg]:size-2.5" },
  md: { box: "size-14", badge: "size-5 -right-0.5 -bottom-0.5 [&_svg]:size-3" },
  lg: { box: "size-36 sm:size-44", badge: "size-11 sm:size-14 right-0 bottom-1 [&_svg]:size-6 sm:[&_svg]:size-7" },
};

export function BotAvatar({ size = "sm", className }: { size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size];
  return (
    <div className={cn("relative shrink-0", s.box, className)}>
      <div className="size-full overflow-hidden rounded-full bg-lavender-strong ring-4 ring-card">
        <img
          src={doctorAvatar}
          alt="PatientCare Bot doctor avatar"
          width={1024}
          height={1024}
          className="size-full scale-[1.35] object-cover object-[50%_18%] translate-y-[8%]"
        />
      </div>
      <span
        className={cn(
          "absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card",
          s.badge,
        )}
      >
        <Plus strokeWidth={3.5} />
      </span>
    </div>
  );
}
