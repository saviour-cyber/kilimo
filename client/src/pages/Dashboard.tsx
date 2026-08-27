import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function Dashboard() {
  const { currentFarm } = useFarm();
  const { data: user } = trpc.users.me.useQuery();

  const greeting = user?.name ? `Habari, ${user.name.split(" ")[0]}` : "Habari";
  const dateStr = format(new Date(), "EEEE, d MMMM");
  const farmName = currentFarm?.farm.name ?? "Farm";
  const location = currentFarm?.farm.location ?? "Kenya";

  if (!currentFarm) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 pb-28 max-w-7xl mx-auto w-full space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground tracking-tight">{greeting}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <span>{dateStr}</span>
            <span>•</span>
            <span className="font-medium text-foreground/80">{farmName}</span>
            <span>•</span>
            <span>{location}</span>
          </p>
        </div>
      </header>

      {/* Blank canvas waiting for user instructions */}
    </div>
  );
}