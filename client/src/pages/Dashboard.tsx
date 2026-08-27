import { useFarm } from "@/contexts/FarmContext";

export default function Dashboard() {
  const { currentFarm } = useFarm();

  if (!currentFarm) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 pb-28 max-w-7xl mx-auto w-full space-y-6">
      {/* Blank dashboard waiting for instructions */}
    </div>
  );
}