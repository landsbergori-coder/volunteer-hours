import { requireRole } from "@/lib/auth";
import { getPlacesSummary } from "@/lib/queries";
import { Card } from "@/components/ui";
import { Role } from "@prisma/client";
import { PlacesTable } from "./PlacesTable";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  await requireRole(Role.ADMIN);
  const places = await getPlacesSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">מקומות התנדבות</h1>
        <p className="text-sm text-gray-500">
          כל המקומות שהוגדרו במערכת, עם פרטי האחראי, התלמידים שמתנדבים בהם כעת
          וסך השעות שנצברו בהם. המקומות נוצרים כשתלמידים מוסיפים אותם.
        </p>
      </div>
      <Card>
        <PlacesTable places={places} />
      </Card>
    </div>
  );
}
