import { getAllCategoryLinks } from "@/lib/affiliate";
import LinksManager from "./LinksManager";
import ChangePassword from "./ChangePassword";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let links: Awaited<ReturnType<typeof getAllCategoryLinks>> = [];
  try {
    links = await getAllCategoryLinks();
  } catch (e) {
    console.error("DB error:", e);
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Афілійовані посилання
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Посилання на категорії в магазинах AliExpress та Temu.
          Відображаються в блоці "Де купити" на всіх статтях відповідної категорії.
        </p>
      </div>

      <LinksManager initialLinks={links} />

      <ChangePassword />
    </div>
  );
}
