import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ForecastScenario = {
  label: string;
  score: number;
  detail: string;
};

type KpiForecastWidgetProps = {
  title: string;
  description: string;
  scenarios: ForecastScenario[];
  suggestions: string[];
};

function formatScore(score: number) {
  return `${Math.max(0, Math.min(100, score)).toFixed(1)} điểm`;
}

export function KpiForecastWidget({ title, description, scenarios, suggestions }: KpiForecastWidgetProps) {
  return (
    <Card className="border-slate-200 bg-white/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-slate-950">{title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <div key={scenario.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {scenario.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatScore(scenario.score)}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
          <p className="text-sm font-medium text-slate-800">Task nên ưu tiên</p>
          {suggestions.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {suggestions.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-teal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Chưa có task nổi bật để ưu tiên trong kỳ này.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
