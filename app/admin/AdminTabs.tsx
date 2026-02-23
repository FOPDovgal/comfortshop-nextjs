"use client";

import { useState } from "react";
import type { AffiliateLink } from "@/lib/affiliate";
import LinksManager from "./LinksManager";
import BannerManager from "./BannerManager";
import ChangePassword from "./ChangePassword";
import ArticlesTab from "./ArticlesTab";
import type { ArticleMeta } from "./ArticlesTab";

const TABS = [
  { id: "articles", label: "📝", title: "Статті" },
  { id: "banner",   label: "🎯", title: "Банер" },
  { id: "links",    label: "🔗", title: "Посилання" },
  { id: "settings", label: "⚙️", title: "Налаштування" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  links: AffiliateLink[];
  articles: ArticleMeta[];
}

export default function AdminTabs({ links, articles }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("articles");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{tab.label}</span>
            <span>{tab.title}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "articles" && <ArticlesTab articles={articles} />}
      {activeTab === "banner"   && <BannerManager />}
      {activeTab === "links"    && (
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Афілійовані посилання</h2>
            <p className="mt-1 text-sm text-gray-500">
              Посилання на категорії в магазинах AliExpress та Temu.
              Відображаються в блоці «Де купити» на всіх статтях відповідної категорії.
            </p>
          </div>
          <LinksManager initialLinks={links} />
        </div>
      )}
      {activeTab === "settings" && <ChangePassword />}
    </div>
  );
}
