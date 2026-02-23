"use client";

export interface ArticleMeta {
  slug: string;
  title: string;
  type: string;
  category: string;
  date: string;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  guide:  { label: "Огляд",     color: "bg-blue-100 text-blue-700" },
  top:    { label: "Топ-список", color: "bg-orange-100 text-orange-700" },
  review: { label: "Рев'ю",     color: "bg-purple-100 text-purple-700" },
};

export default function ArticlesTab({ articles }: { articles: ArticleMeta[] }) {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Статті</h2>
          <p className="mt-1 text-sm text-gray-500">
            {articles.length} статей на сайті
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-5 py-3 text-sm text-indigo-700">
          ✏️ Редактор статей — у наступному оновленні
        </div>
      </div>

      {/* Coming soon: editor features */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "✍️", title: "Візуальний редактор", desc: "WYSIWYG з MDX, вставка посилань і картинок" },
          { icon: "🤖", title: "AI-генерація", desc: "Автоматичне написання статей за промтом" },
          { icon: "🖼️", title: "Картинки з ярликами", desc: "Генерація + накладання «Хіт», «Акція» тощо" },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-4 opacity-60">
            <div className="mb-2 text-2xl">{f.icon}</div>
            <p className="text-sm font-semibold text-gray-800">{f.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Articles list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Назва</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Категорія</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Немає статей
                </td>
              </tr>
            )}
            {articles.map((a) => {
              const typeInfo = TYPE_LABEL[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600" };
              const urlPrefix = a.type === "top" ? "/top" : "/oglyady";
              return (
                <tr key={a.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {a.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {a.category}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(a.date).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${urlPrefix}/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Переглянути ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
