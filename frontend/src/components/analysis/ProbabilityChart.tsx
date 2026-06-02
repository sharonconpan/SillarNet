import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CLASS_LABELS, CLASS_COLORS } from "@/lib/constants";
import type { Top5Item } from "@/api/analysis";

interface Props {
  top5: Top5Item[];
}

export default function ProbabilityChart({ top5 }: Props) {
  const data = top5.map((item) => ({
    name: CLASS_LABELS[item.clase] ?? item.clase,
    value: item.probabilidad,
    color: CLASS_COLORS[item.clase] ?? "#6b7280",
    clase: item.clase,
  }));

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">Probabilidades por clase</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          <Bar dataKey="value" radius={4}>
            {data.map((entry) => (
              <Cell key={entry.clase} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
