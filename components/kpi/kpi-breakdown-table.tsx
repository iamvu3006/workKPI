import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TaskBreakdownRow {
  taskId: string;
  taskTitle: string;
  weight: number;
  progress: number;
  qualityScore: number;
  contribution: number;
  penaltyDays: number;
}

interface KpiBreakdownTableProps {
  tasks: TaskBreakdownRow[];
}

export function KpiBreakdownTable({ tasks }: KpiBreakdownTableProps) {
  return (
    <Card className="border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Chi tiết đóng góp từng Task</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium text-slate-700">Task</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Trọng số</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Tiến độ</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Chất lượng</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">Đóng góp</th>
              <th className="px-3 py-2 text-center font-medium text-slate-700">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tasks.map((task) => (
              <tr key={task.taskId} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <p className="font-medium text-slate-900">{task.taskTitle}</p>
                </td>
                <td className="px-3 py-3 text-right text-slate-600">{task.weight}%</td>
                <td className="px-3 py-3 text-right text-slate-600">{task.progress}%</td>
                <td className="px-3 py-3 text-right text-slate-600">{task.qualityScore}</td>
                <td className="px-3 py-3 text-right font-semibold text-teal-600">
                  +{task.contribution.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-center">
                  {task.penaltyDays > 0 ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      -{task.penaltyDays} ngày
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ Đúng hạn
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">Chưa có task hoàn thành trong tháng</p>
      )}
    </Card>
  );
}
