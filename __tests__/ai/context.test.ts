import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    kpiRecord: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    profile: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

import { buildAiContext } from "@/lib/ai/context";

beforeEach(() => {
  mocks.prisma.task.count.mockReset();
  mocks.prisma.task.findMany.mockReset();
  mocks.prisma.kpiRecord.aggregate.mockReset();
  mocks.prisma.kpiRecord.findMany.mockReset();
  mocks.prisma.profile.findMany.mockReset();

  mocks.prisma.task.count.mockResolvedValue(3);
  mocks.prisma.task.findMany.mockResolvedValue([
    {
      title: "Hoàn thiện báo cáo tháng",
      status: "IN_PROGRESS",
      priority: "HIGH",
      deadline: new Date("2026-05-31T00:00:00.000Z"),
      progressPercent: 60,
      weight: 5,
      departmentId: "dept-1",
      _count: { assignees: 2 },
    },
  ]);
  mocks.prisma.kpiRecord.aggregate.mockResolvedValue({
    _count: { _all: 1 },
    _avg: { totalScore: 87.5, onTimeRate: 91.2 },
  });
});

describe("buildAiContext", () => {
  it("builds a department-scoped context for managers", async () => {
    mocks.prisma.profile.findMany.mockResolvedValue([
      {
        id: "user-2",
        fullName: "Nguyen Van B",
        displayName: "Van B",
        email: "b@workkpi.com",
        department: { name: "Sales" },
      },
    ]);
    mocks.prisma.kpiRecord.findMany.mockResolvedValue([
      {
        userId: "user-2",
        totalScore: 90,
        grade: "GOOD",
        onTimeRate: 95,
      },
    ]);

    const context = await buildAiContext({
      id: "user-1",
      role: "MANAGER",
      departmentId: "dept-1",
      teamId: null,
      fullName: "Nguyen Van A",
      displayName: "Van A",
      email: "a@workkpi.com",
      department: { id: "dept-1", name: "Sales", code: "SALES" },
      team: null,
    });

    expect(context.systemInstruction).toContain("phòng ban Sales (SALES)");
    expect(context.systemInstruction).toContain("Hoàn thiện báo cáo tháng");
    expect(context.kpiSummary).toContain("Van B");
  });

  it("builds a personal context for employees", async () => {
    mocks.prisma.kpiRecord.findMany.mockResolvedValue([
      {
        month: 5,
        year: 2026,
        totalScore: 82,
        grade: "PASS",
        onTimeRate: 88,
      },
    ]);

    const context = await buildAiContext({
      id: "user-1",
      role: "EMPLOYEE",
      departmentId: null,
      teamId: null,
      fullName: "Nguyen Van A",
      displayName: "Van A",
      email: "a@workkpi.com",
      department: null,
      team: null,
    });

    expect(context.systemInstruction).toContain("phạm vi cá nhân");
    expect(context.kpiSummary).toContain("KPI 5/2026");
  });
});