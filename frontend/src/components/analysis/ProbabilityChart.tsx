import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ModelProbs, Probs } from "@/api/analysis";

const SEVERITY_LABELS = { ninguno: "Ninguno", leve: "Leve", grave: "Grave" };
const DET_COLORS  = { ninguno: "#5E8A5C", leve: "#B84020", grave: "#7C1D12" };
const SUC_COLORS  = { ninguno: "#5E8A5C", leve: "#C9973A", grave: "#C07030" };

function ModelBars({ title, data, colors }: { title: string; data: ModelProbs; colors: typeof DET_COLORS }) {
  const bars = (["ninguno", "leve", "grave"] as const).map((k) => ({
    name: SEVERITY_LABELS[k],
    value: data[k],
    color: colors[k],
    key: k,
  }));

  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1">{title}</p>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={bars} layout="vertical" margin={{ left: 0, right: 36 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          <Bar dataKey="value" radius={4}>
            {bars.map((e) => <Cell key={e.key} fill={e.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  probs: Probs;
}

export default function ProbabilityChart({ probs }: Props) {
  return (
    <div className="space-y-4">
      <ModelBars title="Deterioro" data={probs.deterioro} colors={DET_COLORS} />
      <ModelBars title="Suciedad"  data={probs.suciedad}  colors={SUC_COLORS} />
    </div>
  );
}
