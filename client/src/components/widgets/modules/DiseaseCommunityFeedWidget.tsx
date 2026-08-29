import { Link } from "wouter";

export function DiseaseCommunityFeedWidget({ farmId }: { farmId: number }) {
  const scans = [
    { id: 1, title: "Maize Leaf Blight", location: "Kimathi, 2 km away", time: "10 min ago", img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=100&h=100&fit=crop" },
    { id: 2, title: "Aphids on Cabbage", location: "Gathugi, 5 km away", time: "25 min ago", img: "https://images.unsplash.com/photo-1518843875459-f738682238a6?w=100&h=100&fit=crop" },
    { id: 3, title: "Nitrogen Deficiency", location: "Karatina, 8 km away", time: "45 min ago", img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=100&h=100&fit=crop" },
  ];

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[17px] font-bold text-slate-900">What Farmers Are Scanning Near You</h2>
        <Link href="/disease/community">
          <span className="text-[13px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">View All ›</span>
        </Link>
      </div>

      <div className="bg-[#FDFCF5] divide-y divide-slate-100">
        {scans.map(scan => (
          <div key={scan.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200">
              <img src={scan.img} alt={scan.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-slate-900 truncate">{scan.title}</h3>
              <p className="text-[12px] text-slate-500 mt-0.5 truncate">Scanned in {scan.location}</p>
            </div>
            <div className="text-[12px] text-slate-400 whitespace-nowrap ml-2">
              {scan.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
