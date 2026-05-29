import dotenv from "dotenv";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient({ log: ["error"] });

const demoUsers = [
  {
    email: "admin@workkpi.com",
    password: "Password123!",
    fullName: "Mai Nguyen",
    displayName: "Mai Admin",
    role: "ADMIN",
    departmentKey: "exec",
    teamKey: null,
    phone: "0901000001",
    theme: "dark",
    notificationEmail: true,
    defaultTaskFilter: "all",
  },
  {
    email: "director@workkpi.com",
    password: "Password123!",
    fullName: "Quang Tran",
    displayName: "Quang Director",
    role: "DIRECTOR",
    departmentKey: "exec",
    teamKey: null,
    phone: "0901000002",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "company",
  },
  {
    email: "manager.product@workkpi.com",
    password: "Password123!",
    fullName: "Linh Pham",
    displayName: "Linh Product",
    role: "MANAGER",
    departmentKey: "product",
    teamKey: null,
    phone: "0901000003",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "department",
  },
  {
    email: "manager.ops@workkpi.com",
    password: "Password123!",
    fullName: "Tuan Le",
    displayName: "Tuan Ops",
    role: "MANAGER",
    departmentKey: "ops",
    teamKey: null,
    phone: "0901000004",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "department",
  },
  {
    email: "leader.backend@workkpi.com",
    password: "Password123!",
    fullName: "Bao Nguyen",
    displayName: "Bao Backend",
    role: "LEADER",
    departmentKey: "product",
    teamKey: "backend",
    phone: "0901000005",
    theme: "dark",
    notificationEmail: true,
    defaultTaskFilter: "team",
  },
  {
    email: "leader.mobile@workkpi.com",
    password: "Password123!",
    fullName: "Khanh Vo",
    displayName: "Khanh Mobile",
    role: "LEADER",
    departmentKey: "product",
    teamKey: "mobile",
    phone: "0901000006",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "team",
  },
  {
    email: "leader.care@workkpi.com",
    password: "Password123!",
    fullName: "Hoa Nguyen",
    displayName: "Hoa Care",
    role: "LEADER",
    departmentKey: "ops",
    teamKey: "care",
    phone: "0901000007",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "team",
  },
  {
    email: "employee.frontend@workkpi.com",
    password: "Password123!",
    fullName: "Minh Tran",
    displayName: "Minh Frontend",
    role: "EMPLOYEE",
    departmentKey: "product",
    teamKey: "backend",
    phone: "0901000008",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
  {
    email: "employee.qa@workkpi.com",
    password: "Password123!",
    fullName: "Thu Do",
    displayName: "Thu QA",
    role: "EMPLOYEE",
    departmentKey: "product",
    teamKey: "backend",
    phone: "0901000009",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
    forcePasswordChange: true,
  },
  {
    email: "employee.support@workkpi.com",
    password: "Password123!",
    fullName: "Dat Pham",
    displayName: "Dat Support",
    role: "EMPLOYEE",
    departmentKey: "ops",
    teamKey: "care",
    phone: "0901000010",
    theme: "dark",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
  {
    email: "employee.sales@workkpi.com",
    password: "Password123!",
    fullName: "Nhu Le",
    displayName: "Nhu Sales",
    role: "EMPLOYEE",
    departmentKey: "ops",
    teamKey: "care",
    phone: "0901000011",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
];

const extraDemoUsers = [
  {
    email: "manager.data@workkpi.com",
    password: "Password123!",
    fullName: "Huy Nguyen",
    displayName: "Huy Data",
    role: "MANAGER",
    departmentKey: "data",
    teamKey: null,
    phone: "0901000012",
    theme: "dark",
    notificationEmail: true,
    defaultTaskFilter: "department",
  },
  {
    email: "manager.customer@workkpi.com",
    password: "Password123!",
    fullName: "My Le",
    displayName: "My Customer",
    role: "MANAGER",
    departmentKey: "customerSuccess",
    teamKey: null,
    phone: "0901000013",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "department",
  },
  {
    email: "leader.analytics@workkpi.com",
    password: "Password123!",
    fullName: "Khoa Pham",
    displayName: "Khoa Analytics",
    role: "LEADER",
    departmentKey: "data",
    teamKey: "analytics",
    phone: "0901000014",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "team",
  },
  {
    email: "leader.qa@workkpi.com",
    password: "Password123!",
    fullName: "Ngan Tran",
    displayName: "Ngan QA",
    role: "LEADER",
    departmentKey: "data",
    teamKey: "qa",
    phone: "0901000015",
    theme: "dark",
    notificationEmail: true,
    defaultTaskFilter: "team",
  },
  {
    email: "employee.design@workkpi.com",
    password: "Password123!",
    fullName: "Lam Vo",
    displayName: "Lam Design",
    role: "EMPLOYEE",
    departmentKey: "product",
    teamKey: "design",
    phone: "0901000016",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
  {
    email: "employee.docs@workkpi.com",
    password: "Password123!",
    fullName: "An Bui",
    displayName: "An Docs",
    role: "EMPLOYEE",
    departmentKey: "exec",
    teamKey: "strategy",
    phone: "0901000017",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
  {
    email: "employee.ops2@workkpi.com",
    password: "Password123!",
    fullName: "Phuong Hoang",
    displayName: "Phuong Ops",
    role: "EMPLOYEE",
    departmentKey: "ops",
    teamKey: "support",
    phone: "0901000018",
    theme: "dark",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
  {
    email: "employee.data@workkpi.com",
    password: "Password123!",
    fullName: "Duy Phan",
    displayName: "Duy Data",
    role: "EMPLOYEE",
    departmentKey: "data",
    teamKey: "analytics",
    phone: "0901000019",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
  {
    email: "employee.success@workkpi.com",
    password: "Password123!",
    fullName: "Han Do",
    displayName: "Han Success",
    role: "EMPLOYEE",
    departmentKey: "customerSuccess",
    teamKey: "support",
    phone: "0901000020",
    theme: "light",
    notificationEmail: true,
    defaultTaskFilter: "mine",
  },
];

const sampleUsers = [...demoUsers, ...extraDemoUsers];

const sampleCounts = {
  users: 20,
  departments: 5,
  teams: 8,
  tasks: 100,
  subtasks: 40,
  comments: 200,
  attachments: 30,
  checklistItems: 80,
  statusHistory: 150,
  extendRequests: 20,
  notifications: 100,
  sessions: 50,
  trustedDevices: 30,
  loginAttempts: 40,
  kpiRecords: 60,
  auditLogs: 120,
};

function cycle(items, index) {
  return items[index % items.length];
}

function repeat(count, factory) {
  return Array.from({ length: count }, (_, index) => factory(index));
}

const now = new Date();

function addDays(baseDate, days, hours = 10) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date;
}

function startOfMonth(baseDate, monthOffset = 0) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1, 0, 0, 0, 0);
}

function makeToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function buildFingerprint(deviceName, userAgent) {
  return createHash("sha256")
    .update([deviceName, userAgent].filter(Boolean).join("|").toLowerCase())
    .digest("hex");
}

function gradeForScore(score) {
  if (score >= 90) return "EXCELLENT";
  if (score >= 80) return "GOOD";
  if (score >= 65) return "PASS";
  return "NEEDS_IMPROVEMENT";
}

function demoTask(title, overrides = {}) {
  return {
    id: randomUUID(),
    title,
    description: overrides.description ?? null,
    status: overrides.status ?? "TO_DO",
    priority: overrides.priority ?? "NORMAL",
    weight: overrides.weight ?? 50,
    deadline: overrides.deadline ?? addDays(now, 3),
    progressPercent: overrides.progressPercent ?? 0,
    tags: overrides.tags ?? [],
    pendingReason: overrides.pendingReason ?? null,
    pendingBlockType: overrides.pendingBlockType ?? null,
    rejectReason: overrides.rejectReason ?? null,
    urgentOverrideReason: overrides.urgentOverrideReason ?? null,
    startedAt: overrides.startedAt ?? null,
    submittedAt: overrides.submittedAt ?? null,
    reviewSummary: overrides.reviewSummary ?? null,
    selfAssessment: overrides.selfAssessment ?? null,
    qualityScoreRaw: overrides.qualityScoreRaw ?? null,
    qualityScore: overrides.qualityScore ?? null,
    penaltyDays: overrides.penaltyDays ?? 0,
    reviewedAt: overrides.reviewedAt ?? null,
    reviewedById: overrides.reviewedById ?? null,
    reviewComment: overrides.reviewComment ?? null,
    reviewRejectReason: overrides.reviewRejectReason ?? null,
    completedAt: overrides.completedAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    deletedAt: null,
    createdById: overrides.createdById,
    departmentId: overrides.departmentId,
    parentTaskId: overrides.parentTaskId ?? null,
    createdAt: overrides.createdAt ?? addDays(now, -7),
    updatedAt: overrides.updatedAt ?? addDays(now, -1),
  };
}

async function ensureAuthUsers() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("<service-role-key>")) {
    throw new Error(
      "Missing a real SUPABASE_SERVICE_ROLE_KEY. Replace the placeholder in .env.local with the service-role key from Supabase project settings, then rerun npm run seed."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    throw new Error(`Failed to list Supabase auth users: ${error.message}`);
  }

  const userByEmail = new Map((data.users ?? []).map((user) => [user.email?.toLowerCase() ?? "", user]));
  const resolvedUsers = new Map();

  for (const userConfig of sampleUsers) {
    const emailKey = userConfig.email.toLowerCase();
    const existingUser = userByEmail.get(emailKey);

    if (existingUser) {
      resolvedUsers.set(emailKey, existingUser);
      continue;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true,
      user_metadata: {
        full_name: userConfig.fullName,
        display_name: userConfig.displayName,
      },
      app_metadata: {
        role: userConfig.role,
      },
    });

    if (createError || !created.user) {
      throw new Error(`Failed to create auth user ${userConfig.email}: ${createError?.message ?? "Unknown error"}`);
    }

    resolvedUsers.set(emailKey, created.user);
  }

  return resolvedUsers;
}

async function main() {
  try {
    console.log("Seeding demo auth users...");
    const authUsersByEmail = await ensureAuthUsers();

    const userId = (email) => {
      const user = authUsersByEmail.get(email.toLowerCase());
      if (!user) {
        throw new Error(`Missing seeded auth user for ${email}`);
      }
      return user.id;
    };

    const ids = {
      departments: {
        exec: randomUUID(),
        product: randomUUID(),
        ops: randomUUID(),
        data: randomUUID(),
        customerSuccess: randomUUID(),
      },
      teams: {
        backend: randomUUID(),
        mobile: randomUUID(),
        care: randomUUID(),
        analytics: randomUUID(),
        qa: randomUUID(),
        design: randomUUID(),
        strategy: randomUUID(),
        support: randomUUID(),
      },
      tasks: {},
    };

    const taskDefinitions = {
      execRoadmap: demoTask("Thiết kế lộ trình KPI theo vai trò", {
        departmentId: ids.departments.exec,
        createdById: userId("director@workkpi.com"),
        status: "DONE",
        priority: "HIGH",
        weight: 90,
        deadline: addDays(now, -3),
        progressPercent: 100,
        tags: ["kpi", "strategy"],
        startedAt: addDays(now, -10, 9),
        submittedAt: addDays(now, -4, 16),
        reviewedAt: addDays(now, -3, 11),
        reviewedById: userId("admin@workkpi.com"),
        completedAt: addDays(now, -3, 15),
        qualityScoreRaw: 92,
        qualityScore: 93,
        selfAssessment: { confidence: 9, impact: 10, notes: "Hoàn thiện cho demo cấp công ty." },
        reviewSummary: "Được duyệt và dùng làm khung cho demo.",
      }),
      kpiDashboard: demoTask("Hoàn thiện dashboard KPI tháng", {
        departmentId: ids.departments.product,
        createdById: userId("manager.product@workkpi.com"),
        status: "IN_PROGRESS",
        priority: "URGENT",
        weight: 85,
        deadline: addDays(now, 2),
        progressPercent: 68,
        tags: ["dashboard", "kpi", "ui"],
        startedAt: addDays(now, -2, 10),
        selfAssessment: { confidence: 7, impact: 9, notes: "Đã xong phần chart chính." },
      }),
      apiStats: demoTask("Thiết kế API thống kê hiệu suất", {
        departmentId: ids.departments.product,
        createdById: userId("leader.backend@workkpi.com"),
        status: "REVIEW",
        priority: "HIGH",
        weight: 75,
        deadline: addDays(now, -1),
        progressPercent: 92,
        tags: ["api", "report"],
        startedAt: addDays(now, -6, 9),
        submittedAt: addDays(now, -1, 14),
        reviewedById: userId("manager.product@workkpi.com"),
        reviewedAt: addDays(now, -1, 17),
        qualityScoreRaw: 87,
        qualityScore: 88,
        reviewSummary: "Cần bổ sung pagination và mapping phòng ban.",
        reviewComment: "Phần API đủ dùng cho demo, chỉ cần polish response meta.",
      }),
      authFlow: demoTask("Tối ưu luồng đăng nhập và cảnh báo bảo mật", {
        departmentId: ids.departments.product,
        createdById: userId("leader.mobile@workkpi.com"),
        status: "TO_DO",
        priority: "NORMAL",
        weight: 45,
        deadline: addDays(now, 5),
        tags: ["auth", "security"],
        selfAssessment: { confidence: 6, impact: 8 },
      }),
      supportProcess: demoTask("Chuẩn hóa quy trình hỗ trợ khách hàng", {
        departmentId: ids.departments.ops,
        createdById: userId("manager.ops@workkpi.com"),
        status: "PENDING",
        priority: "HIGH",
        weight: 60,
        deadline: addDays(now, -2),
        progressPercent: 40,
        tags: ["support", "ops"],
        pendingReason: "Chờ xác nhận từ bộ phận chăm sóc khách hàng.",
        pendingBlockType: "RESOURCE",
      }),
      autoReply: demoTask("Triển khai phản hồi ticket tự động", {
        departmentId: ids.departments.ops,
        createdById: userId("leader.care@workkpi.com"),
        status: "REVIEW",
        priority: "NORMAL",
        weight: 55,
        deadline: addDays(now, 1),
        progressPercent: 88,
        tags: ["ticket", "automation"],
        startedAt: addDays(now, -4, 9),
        submittedAt: addDays(now, 0, 11),
        reviewedById: userId("manager.ops@workkpi.com"),
        reviewedAt: addDays(now, 0, 15),
        qualityScoreRaw: 81,
        qualityScore: 82,
        reviewSummary: "Luồng cơ bản chạy ổn, cần bổ sung template phản hồi.",
      }),
      dashboardSecurity: demoTask("Kiểm thử quyền truy cập dashboard", {
        departmentId: ids.departments.exec,
        createdById: userId("admin@workkpi.com"),
        status: "CANCELLED",
        priority: "LOW",
        weight: 30,
        deadline: addDays(now, -5),
        progressPercent: 25,
        tags: ["security", "access"],
        cancelledAt: addDays(now, -4, 13),
        rejectReason: "Đổi sang phương án kiểm thử tự động.",
      }),
      monthlyReport: demoTask("Báo cáo KPI tháng cho ban điều hành", {
        departmentId: ids.departments.exec,
        createdById: userId("director@workkpi.com"),
        status: "DONE",
        priority: "HIGH",
        weight: 70,
        deadline: addDays(now, -1),
        progressPercent: 100,
        tags: ["report", "kpi"],
        startedAt: addDays(now, -7, 9),
        submittedAt: addDays(now, -2, 18),
        reviewedById: userId("admin@workkpi.com"),
        reviewedAt: addDays(now, -1, 10),
        completedAt: addDays(now, -1, 14),
        qualityScoreRaw: 95,
        qualityScore: 96,
        reviewSummary: "Số liệu đầy đủ, có thể dùng ngay cho demo.",
      }),
      parentKpiTask: demoTask("Thiết kế hệ thống báo cáo KPI theo vai trò", {
        departmentId: ids.departments.product,
        createdById: userId("director@workkpi.com"),
        status: "IN_PROGRESS",
        priority: "HIGH",
        weight: 100,
        deadline: addDays(now, 4),
        progressPercent: 61,
        tags: ["reports", "role-based", "dashboard"],
        startedAt: addDays(now, -3, 9),
        selfAssessment: { confidence: 8, impact: 10, blockers: 1 },
      }),
    };

    ids.tasks = Object.fromEntries(Object.entries(taskDefinitions).map(([key, task]) => [key, task.id]));

    const subtaskDefinitions = [
      demoTask("Xây dựng API tổng hợp KPI", {
        departmentId: ids.departments.product,
        createdById: userId("leader.backend@workkpi.com"),
        status: "IN_PROGRESS",
        priority: "HIGH",
        weight: 35,
        deadline: addDays(now, 3),
        progressPercent: 72,
        parentTaskId: ids.tasks.parentKpiTask,
        tags: ["api", "kpi"],
        startedAt: addDays(now, -2, 9),
      }),
      demoTask("Thiết kế component bảng xếp hạng", {
        departmentId: ids.departments.product,
        createdById: userId("leader.mobile@workkpi.com"),
        status: "TO_DO",
        priority: "NORMAL",
        weight: 28,
        deadline: addDays(now, 4),
        progressPercent: 12,
        parentTaskId: ids.tasks.parentKpiTask,
        tags: ["ui", "ranking"],
      }),
      demoTask("Viết kiểm thử dữ liệu KPI", {
        departmentId: ids.departments.product,
        createdById: userId("employee.qa@workkpi.com"),
        status: "REVIEW",
        priority: "NORMAL",
        weight: 30,
        deadline: addDays(now, 2),
        progressPercent: 90,
        parentTaskId: ids.tasks.parentKpiTask,
        tags: ["qa", "testing"],
        reviewedById: userId("leader.backend@workkpi.com"),
        reviewedAt: addDays(now, 0, 16),
        submittedAt: addDays(now, 0, 11),
        qualityScoreRaw: 84,
        qualityScore: 85,
      }),
    ];

    const allTasks = [
      taskDefinitions.execRoadmap,
      taskDefinitions.kpiDashboard,
      taskDefinitions.apiStats,
      taskDefinitions.authFlow,
      taskDefinitions.supportProcess,
      taskDefinitions.autoReply,
      taskDefinitions.dashboardSecurity,
      taskDefinitions.monthlyReport,
      taskDefinitions.parentKpiTask,
      ...subtaskDefinitions,
    ];

    const taskByKey = Object.fromEntries([
      ["execRoadmap", taskDefinitions.execRoadmap.id],
      ["kpiDashboard", taskDefinitions.kpiDashboard.id],
      ["apiStats", taskDefinitions.apiStats.id],
      ["authFlow", taskDefinitions.authFlow.id],
      ["supportProcess", taskDefinitions.supportProcess.id],
      ["autoReply", taskDefinitions.autoReply.id],
      ["dashboardSecurity", taskDefinitions.dashboardSecurity.id],
      ["monthlyReport", taskDefinitions.monthlyReport.id],
      ["parentKpiTask", taskDefinitions.parentKpiTask.id],
      ["subApiKpi", subtaskDefinitions[0].id],
      ["subRankingUi", subtaskDefinitions[1].id],
      ["subKpiTests", subtaskDefinitions[2].id],
    ]);

    const generatedTasks = repeat(sampleCounts.tasks - allTasks.length, (index) => {
      const isSubtask = index < sampleCounts.subtasks - subtaskDefinitions.length;
      const departmentId = cycle(
        [
          ids.departments.exec,
          ids.departments.product,
          ids.departments.ops,
          ids.departments.data,
          ids.departments.customerSuccess,
        ],
        index
      );
      const creator = cycle(sampleUsers, index);
      const status = cycle(["TO_DO", "IN_PROGRESS", "PENDING", "REVIEW", "DONE", "CANCELLED"], index);
      const priority = cycle(["LOW", "NORMAL", "HIGH", "URGENT"], index);
      const task = demoTask(`Mau task ${index + 1}`, {
        departmentId,
        createdById: userId(creator.email),
        status,
        priority,
        weight: 20 + ((index * 7) % 85),
        deadline: addDays(now, (index % 12) - 4),
        progressPercent: status === "DONE" ? 100 : status === "REVIEW" ? 88 : status === "IN_PROGRESS" ? 62 : status === "PENDING" ? 40 : 0,
        tags: ["seed", departmentId === ids.departments.exec ? "exec" : departmentId === ids.departments.product ? "product" : departmentId === ids.departments.ops ? "ops" : departmentId === ids.departments.data ? "data" : "cx"],
        startedAt: status === "TO_DO" || status === "CANCELLED" ? null : addDays(now, -((index % 8) + 1), 9),
        submittedAt: status === "REVIEW" || status === "DONE" ? addDays(now, -((index % 5) + 1), 14) : null,
        reviewedAt: status === "REVIEW" || status === "DONE" ? addDays(now, -((index % 4) + 1), 16) : null,
        reviewedById: status === "REVIEW" || status === "DONE" ? userId(cycle(sampleUsers, index + 3).email) : null,
        completedAt: status === "DONE" ? addDays(now, -((index % 3) + 1), 18) : null,
        cancelledAt: status === "CANCELLED" ? addDays(now, -((index % 3) + 1), 13) : null,
        pendingReason: status === "PENDING" ? "Dang cho du lieu bo sung cho seed." : null,
        pendingBlockType: status === "PENDING" ? cycle(["RESOURCE", "SKILL", "OTHER"], index) : null,
        reviewSummary: status === "REVIEW" || status === "DONE" ? "Ban ghi mau phuc vu demo." : null,
        qualityScoreRaw: status === "REVIEW" || status === "DONE" ? 78 + (index % 15) : null,
        qualityScore: status === "REVIEW" || status === "DONE" ? 79 + (index % 15) : null,
      });

      if (isSubtask) {
        task.parentTaskId = taskByKey.parentKpiTask;
      }

      return task;
    });

    const seededTasks = [...allTasks, ...generatedTasks];
    const seededTaskIds = seededTasks.map((task) => task.id);

    const generatedComments = repeat(sampleCounts.comments - 3, (index) => ({
      id: randomUUID(),
      taskId: cycle(seededTaskIds, index),
      authorId: userId(cycle(sampleUsers, index).email),
      content: `Comment mau ${index + 1} cho task seed.`,
      parentId: null,
    }));

    const generatedAttachments = repeat(sampleCounts.attachments - 2, (index) => ({
      id: randomUUID(),
      taskId: cycle(seededTaskIds, index + 5),
      uploadedById: userId(cycle(sampleUsers, index + 2).email),
      fileName: `file-${index + 1}.pdf`,
      fileUrl: `https://example.com/files/file-${index + 1}.pdf`,
      storagePath: `demo/tasks/file-${index + 1}.pdf`,
      fileSize: 48_000 + index * 1_000,
      mimeType: "application/pdf",
    }));

    const generatedChecklistItems = repeat(sampleCounts.checklistItems - 5, (index) => ({
      id: randomUUID(),
      taskId: cycle(seededTaskIds, index + 7),
      title: `Checklist mau ${index + 1}`,
      isDone: index % 3 === 0,
      sortOrder: index + 1,
    }));

    const generatedStatusHistory = repeat(sampleCounts.statusHistory - 3, (index) => ({
      id: randomUUID(),
      taskId: cycle(seededTaskIds, index),
      fromStatus: cycle(["TO_DO", "IN_PROGRESS", "PENDING", "REVIEW", "DONE"], index),
      toStatus: cycle(["IN_PROGRESS", "PENDING", "REVIEW", "DONE", "CANCELLED"], index),
      reason: `Lich su trang thai mau ${index + 1}`,
      actorId: userId(cycle(sampleUsers, index + 1).email),
      metadata: { source: "seed", index },
    }));

    const generatedExtendRequests = repeat(sampleCounts.extendRequests - 2, (index) => ({
      id: randomUUID(),
      taskId: cycle(seededTaskIds, index + 10),
      requestedById: userId(cycle(sampleUsers, index + 4).email),
      proposedDeadline: addDays(now, (index % 8) + 2),
      reason: `De nghi gia han mau ${index + 1}`,
      status: cycle(["PENDING", "APPROVED", "REJECTED"], index),
      reviewedById: index % 3 === 0 ? null : userId(cycle(sampleUsers, index + 5).email),
      reviewedAt: index % 3 === 0 ? null : addDays(now, -(index % 5), 15),
    }));

    const generatedNotifications = repeat(sampleCounts.notifications - 4, (index) => ({
      id: randomUUID(),
      userId: userId(cycle(sampleUsers, index).email),
      type: cycle(["task.assigned", "task.completed", "task.review", "security.device_trusted"], index),
      title: `Thong bao mau ${index + 1}`,
      body: `Noi dung thong bao mau so ${index + 1}.`,
      payload: { index, source: "seed" },
      readAt: index % 2 === 0 ? null : addDays(now, -1, 15),
      createdAt: addDays(now, -(index % 6), 8),
    }));

    const generatedSessions = repeat(sampleCounts.sessions - (sampleUsers.length + 6), (index) => ({
      id: randomUUID(),
      userId: userId(cycle(sampleUsers, index).email),
      sessionTokenHash: hashToken(makeToken()),
      deviceName: cycle(["MacBook Pro", "Windows Laptop", "iPad", "Pixel 8"], index),
      ipAddress: `10.10.2.${index + 1}`,
      userAgent: `WorkKPI Demo Session/${index + 1}`,
      isCurrent: index % 3 === 0,
      revokedAt: index % 3 === 0 ? null : addDays(now, -((index % 7) + 2), 12),
      lastSeenAt: addDays(now, -((index % 4) + 1), 9),
      expiresAt: addDays(now, (index % 12) + 1, 9),
      createdAt: addDays(now, -((index % 9) + 2), 9),
      updatedAt: addDays(now, -((index % 5) + 1), 10),
    }));

    const generatedTrustedDevices = repeat(sampleCounts.trustedDevices - sampleUsers.length, (index) => {
      const deviceName = cycle(["MacBook Pro", "Surface Laptop", "ThinkPad", "iPhone"], index);
      const userAgent = `WorkKPI Demo Device/${index + 1}`;

      return {
        id: randomUUID(),
        userId: userId(cycle(sampleUsers, index).email),
        deviceFingerprint: buildFingerprint(deviceName, userAgent),
        deviceName,
        ipAddress: `10.10.3.${index + 1}`,
        userAgent,
        trustedUntil: addDays(now, 30 - (index % 7), 8),
        lastSeenAt: addDays(now, -((index % 5) + 1), 10),
        createdAt: addDays(now, -((index % 12) + 2), 11),
        updatedAt: addDays(now, -((index % 4) + 1), 10),
      };
    });

    const generatedLoginAttempts = repeat(sampleCounts.loginAttempts - 3, (index) => ({
      id: randomUUID(),
      email: cycle(sampleUsers, index).email,
      userId: userId(cycle(sampleUsers, index).email),
      ipAddress: `10.10.4.${index + 1}`,
      userAgent: `Demo Browser/${index + 1}`,
      success: index % 4 !== 0,
      failureReason: index % 4 !== 0 ? null : "Invalid credentials",
      attemptedAt: addDays(now, -((index % 10) + 1), 8),
    }));

    const generatedKpiRecords = repeat(sampleCounts.kpiRecords - sampleUsers.length * 2, (index) => {
      const userConfig = cycle(sampleUsers, index);
      const recordMonth = startOfMonth(now, -2 - index);
      const score = 60 + (index % 35);

      return {
        id: randomUUID(),
        userId: userId(userConfig.email),
        month: recordMonth.getMonth() + 1,
        year: recordMonth.getFullYear(),
        totalScore: score,
        grade: gradeForScore(score),
        taskBreakdown: {
          done: 2 + (index % 5),
          inProgress: 1 + (index % 4),
          overdue: index % 3,
          pending: index % 2,
        },
        onTimeRate: Math.max(55, 84 - (index % 18)),
        calculatedAt: addDays(now, -((index % 6) + 1), 18),
        calculatedById: userId(cycle(sampleUsers, index + 1).email),
      };
    });

    const generatedAuditLogs = repeat(sampleCounts.auditLogs - 5, (index) => ({
      id: randomUUID(),
      actorUserId: userId(cycle(sampleUsers, index).email),
      action: cycle(["login", "logout", "profile_updated", "settings_updated", "password_changed"], index),
      entityType: cycle(["profile", "task", "user_session", "notification"], index),
      entityId: index % 2 === 0 ? null : cycle(seededTaskIds, index),
      metadata: { source: "seed", index },
      createdAt: addDays(now, -((index % 14) + 1), 9),
    }));

    console.log("Refreshing demo database rows...");

    await prisma.$transaction([
      prisma.taskExtendRequest.deleteMany(),
      prisma.taskStatusHistory.deleteMany(),
      prisma.taskAttachment.deleteMany(),
      prisma.taskComment.deleteMany(),
      prisma.taskChecklistItem.deleteMany(),
      prisma.taskAssignee.deleteMany(),
      prisma.kpiRecord.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.trustedDevice.deleteMany(),
      prisma.userSession.deleteMany(),
      prisma.loginAttempt.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.task.deleteMany(),
      prisma.team.deleteMany(),
      prisma.department.deleteMany(),
      prisma.profile.deleteMany(),
    ]);

    const profileRows = sampleUsers.map((userConfig) => ({
      id: userId(userConfig.email),
      email: userConfig.email,
      fullName: userConfig.fullName,
      displayName: userConfig.displayName,
      phone: userConfig.phone,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userConfig.displayName)}`,
      avatarUploadedAt: addDays(now, -12, 9),
      role: userConfig.role,
      status: "ACTIVE",
      forcePasswordChange: Boolean(userConfig.forcePasswordChange),
      departmentId: null,
      teamId: null,
      theme: userConfig.theme,
      locale: "vi-VN",
      timeZone: "Asia/Ho_Chi_Minh",
      lastLoginAt: addDays(now, -1, 8),
      lockedUntil: null,
      notificationEmail: Boolean(userConfig.notificationEmail),
      keyboardShortcuts: "enabled",
      defaultTaskFilter: userConfig.defaultTaskFilter,
    }));

    await prisma.profile.createMany({ data: profileRows });

    const departments = [
      {
        id: ids.departments.exec,
        name: "Ban Dieu Hanh",
        code: "EXEC",
        description: "Quy hoach, tai chinh, quyen han va bao cao cap cong ty.",
        managerId: userId("director@workkpi.com"),
      },
      {
        id: ids.departments.product,
        name: "San Pham & Ky Thuat",
        code: "PROD",
        description: "Phat trien san pham, dashboard, API va chat luong he thong.",
        managerId: userId("manager.product@workkpi.com"),
      },
      {
        id: ids.departments.ops,
        name: "Van Hanh & Cham Soc",
        code: "OPS",
        description: "Ho tro khach hang, quy trinh van hanh va bao cao dinh ky.",
        managerId: userId("manager.ops@workkpi.com"),
      },
      {
        id: ids.departments.data,
        name: "Du Lieu & Phan Tich",
        code: "DATA",
        description: "Quan tri du lieu KPI, dashboard phan tich va chat luong so lieu.",
        managerId: userId("manager.data@workkpi.com"),
      },
      {
        id: ids.departments.customerSuccess,
        name: "Thanh Cong Khach Hang",
        code: "CUST",
        description: "Xu ly y kien, hanh trinh khach hang va thong bao lien quan.",
        managerId: userId("manager.customer@workkpi.com"),
      },
    ];

    await prisma.department.createMany({ data: departments });

    const teams = [
      {
        id: ids.teams.backend,
        name: "Backend Platform",
        description: "Doi backend phu trach API, KPI engine va du lieu tong hop.",
        leaderId: userId("leader.backend@workkpi.com"),
        departmentId: ids.departments.product,
      },
      {
        id: ids.teams.mobile,
        name: "Mobile Experience",
        description: "Doi giao dien va trai nghiem nguoi dung cho dashboard.",
        leaderId: userId("leader.mobile@workkpi.com"),
        departmentId: ids.departments.product,
      },
      {
        id: ids.teams.care,
        name: "Customer Care",
        description: "Doi xu ly ticket, thong bao va quy trinh ho tro khach hang.",
        leaderId: userId("leader.care@workkpi.com"),
        departmentId: ids.departments.ops,
      },
      {
        id: ids.teams.analytics,
        name: "Analytics Core",
        description: "Doi phan tich KPI, so lieu tong hop va mo hinh bao cao.",
        leaderId: userId("leader.analytics@workkpi.com"),
        departmentId: ids.departments.data,
      },
      {
        id: ids.teams.qa,
        name: "Quality Assurance",
        description: "Doi kiem thu chat luong du lieu va quy trinh KPI.",
        leaderId: userId("leader.qa@workkpi.com"),
        departmentId: ids.departments.data,
      },
      {
        id: ids.teams.design,
        name: "Product Design",
        description: "Doi thiet ke dashboard va luong tuong tac nguoi dung.",
        leaderId: userId("leader.mobile@workkpi.com"),
        departmentId: ids.departments.product,
      },
      {
        id: ids.teams.strategy,
        name: "Strategy Docs",
        description: "Doi tai lieu chien luoc, quy dinh va mo ta scope.",
        leaderId: userId("director@workkpi.com"),
        departmentId: ids.departments.exec,
      },
      {
        id: ids.teams.support,
        name: "Customer Support",
        description: "Doi ho tro khach hang, ticket va thong bao.",
        leaderId: userId("manager.customer@workkpi.com"),
        departmentId: ids.departments.customerSuccess,
      },
    ];

    await prisma.team.createMany({ data: teams });

    await Promise.all(
      sampleUsers.map((userConfig) => {
        const updates = {
          departmentId: ids.departments[userConfig.departmentKey],
          teamId: userConfig.teamKey ? ids.teams[userConfig.teamKey] : null,
        };

        return prisma.profile.update({ where: { id: userId(userConfig.email) }, data: updates });
      })
    );

    await prisma.task.createMany({ data: seededTasks });

    const taskAssignments = [
      ["execRoadmap", ["director@workkpi.com", "admin@workkpi.com"]],
      ["kpiDashboard", ["leader.backend@workkpi.com", "employee.frontend@workkpi.com"]],
      ["apiStats", ["leader.backend@workkpi.com", "employee.qa@workkpi.com"]],
      ["authFlow", ["leader.mobile@workkpi.com", "employee.frontend@workkpi.com"]],
      ["supportProcess", ["manager.ops@workkpi.com", "employee.support@workkpi.com"]],
      ["autoReply", ["leader.care@workkpi.com", "employee.sales@workkpi.com"]],
      ["dashboardSecurity", ["admin@workkpi.com", "director@workkpi.com"]],
      ["monthlyReport", ["director@workkpi.com", "admin@workkpi.com"]],
      ["parentKpiTask", ["leader.backend@workkpi.com", "leader.mobile@workkpi.com", "employee.frontend@workkpi.com"]],
      ["subApiKpi", ["leader.backend@workkpi.com"]],
      ["subRankingUi", ["leader.mobile@workkpi.com", "employee.frontend@workkpi.com"]],
      ["subKpiTests", ["employee.qa@workkpi.com"]],
    ];

    await prisma.taskAssignee.createMany({
      data: taskAssignments.flatMap(([taskKey, assigneeEmails]) =>
        assigneeEmails.map((email) => ({
          taskId: taskByKey[taskKey],
          assigneeId: userId(email),
        }))
      ),
    });

    await prisma.taskChecklistItem.createMany({
      data: [
        { id: randomUUID(), taskId: taskByKey.parentKpiTask, title: "Chot scope theo role", isDone: true, sortOrder: 1 },
        { id: randomUUID(), taskId: taskByKey.parentKpiTask, title: "Tong hop KPI theo phong ban", isDone: true, sortOrder: 2 },
        { id: randomUUID(), taskId: taskByKey.parentKpiTask, title: "Gan widget xep hang ca nhan", isDone: false, sortOrder: 3 },
        { id: randomUUID(), taskId: taskByKey.kpiDashboard, title: "Kiem tra responsive mobile", isDone: true, sortOrder: 1 },
        { id: randomUUID(), taskId: taskByKey.supportProcess, title: "Duyet quy trinh ticket", isDone: false, sortOrder: 1 },
        ...generatedChecklistItems,
      ],
    });

    await prisma.taskComment.createMany({
      data: [
        {
          id: randomUUID(),
          taskId: taskByKey.parentKpiTask,
          authorId: userId("director@workkpi.com"),
          content: "Phan scope nay dung cho demo. Uu tien hoan thien phan KPI theo phong ban truoc.",
          parentId: null,
        },
        {
          id: randomUUID(),
          taskId: taskByKey.parentKpiTask,
          authorId: userId("leader.backend@workkpi.com"),
          content: "Da chot API tong hop, se dong bo voi dashboard trong buoi demo nay.",
          parentId: null,
        },
        {
          id: randomUUID(),
          taskId: taskByKey.parentKpiTask,
          authorId: userId("employee.frontend@workkpi.com"),
          content: "Se can them du lieu KPI mau de lam chart dep hon.",
          parentId: null,
        },
        ...generatedComments,
      ],
    });

    await prisma.taskAttachment.createMany({
      data: [
        {
          id: randomUUID(),
          taskId: taskByKey.parentKpiTask,
          uploadedById: userId("leader.backend@workkpi.com"),
          fileName: "kpi-role-map.xlsx",
          fileUrl: "https://example.com/files/kpi-role-map.xlsx",
          storagePath: "demo/tasks/kpi-role-map.xlsx",
          fileSize: 128_000,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        {
          id: randomUUID(),
          taskId: taskByKey.apiStats,
          uploadedById: userId("employee.qa@workkpi.com"),
          fileName: "api-checklist.pdf",
          fileUrl: "https://example.com/files/api-checklist.pdf",
          storagePath: "demo/tasks/api-checklist.pdf",
          fileSize: 64_000,
          mimeType: "application/pdf",
        },
        ...generatedAttachments,
      ],
    });

    await prisma.taskStatusHistory.createMany({
      data: [
        {
          id: randomUUID(),
          taskId: taskByKey.parentKpiTask,
          fromStatus: "TO_DO",
          toStatus: "IN_PROGRESS",
          reason: "Bat dau phan chia scope the role",
          actorId: userId("director@workkpi.com"),
          metadata: { stage: "planning" },
        },
        {
          id: randomUUID(),
          taskId: taskByKey.parentKpiTask,
          fromStatus: "IN_PROGRESS",
          toStatus: "REVIEW",
          reason: "Da co API mau va dashboard prototype",
          actorId: userId("leader.backend@workkpi.com"),
          metadata: { stage: "review" },
        },
        {
          id: randomUUID(),
          taskId: taskByKey.apiStats,
          fromStatus: "TO_DO",
          toStatus: "IN_PROGRESS",
          reason: "Khoi dong sau khi chot schema KPI",
          actorId: userId("leader.backend@workkpi.com"),
          metadata: { stage: "development" },
        },
        ...generatedStatusHistory,
      ],
    });

    await prisma.taskExtendRequest.createMany({
      data: [
        {
          id: randomUUID(),
          taskId: taskByKey.supportProcess,
          requestedById: userId("manager.ops@workkpi.com"),
          proposedDeadline: addDays(now, 4),
          reason: "Can them 3 ngay de hoan tat quy trinh ticket va cai dat dashboard thong bao.",
          status: "PENDING",
          reviewedById: null,
          reviewedAt: null,
        },
        {
          id: randomUUID(),
          taskId: taskByKey.apiStats,
          requestedById: userId("leader.backend@workkpi.com"),
          proposedDeadline: addDays(now, 2),
          reason: "Cho them mot ngay de canh dong so lieu voi task KPI tong hop.",
          status: "APPROVED",
          reviewedById: userId("manager.product@workkpi.com"),
          reviewedAt: addDays(now, -1, 15),
        },
        ...generatedExtendRequests,
      ],
    });

    const loginNow = addDays(now, -1, 9);
    const sessionExpiry = addDays(loginNow, 8, 9);

    const currentSessions = sampleUsers.map((userConfig, index) => {
      const rawToken = makeToken();
      const createdAt = new Date(loginNow.getTime() - index * 60_000);

      return {
        id: randomUUID(),
        userId: userId(userConfig.email),
        sessionTokenHash: hashToken(rawToken),
        deviceName: index % 2 === 0 ? "MacBook Pro" : "Windows Laptop",
        ipAddress: `10.10.0.${20 + index}`,
        userAgent: `WorkKPI Demo Agent/${index + 1}`,
        isCurrent: true,
        revokedAt: null,
        lastSeenAt: createdAt,
        expiresAt: sessionExpiry,
        createdAt,
        updatedAt: createdAt,
      };
    });

    const revokedSessions = sampleUsers.slice(0, 6).map((userConfig, index) => {
      const oldToken = makeToken();
      const lastSeenAt = addDays(now, -12 - index, 8);
      const revokedAt = addDays(now, -10 - index, 12);

      return {
        id: randomUUID(),
        userId: userId(userConfig.email),
        sessionTokenHash: hashToken(oldToken),
        deviceName: "Old Laptop",
        ipAddress: `10.10.1.${index + 1}`,
        userAgent: `Legacy Demo Agent/${index + 1}`,
        isCurrent: false,
        revokedAt,
        lastSeenAt,
        expiresAt: addDays(lastSeenAt, 8, 8),
        createdAt: lastSeenAt,
        updatedAt: revokedAt,
      };
    });

    await prisma.userSession.createMany({ data: [...currentSessions, ...revokedSessions, ...generatedSessions] });

    const trustedDevices = sampleUsers.map((userConfig, index) => {
      const deviceName = index % 2 === 0 ? "MacBook Pro" : "Surface Laptop";
      const userAgent = `WorkKPI Demo Agent/${index + 1}`;

      return {
        id: randomUUID(),
        userId: userId(userConfig.email),
        deviceFingerprint: buildFingerprint(deviceName, userAgent),
        deviceName,
        ipAddress: `10.10.0.${30 + index}`,
        userAgent,
        trustedUntil: addDays(now, 30, 8),
        lastSeenAt: addDays(now, -1, 10),
        createdAt: addDays(now, -14, 11),
        updatedAt: addDays(now, -1, 10),
      };
    });

    await prisma.trustedDevice.createMany({ data: [...trustedDevices, ...generatedTrustedDevices] });

    await prisma.loginAttempt.createMany({
      data: [
        {
          id: randomUUID(),
          email: "employee.qa@workkpi.com",
          userId: userId("employee.qa@workkpi.com"),
          ipAddress: "10.10.0.9",
          userAgent: "Demo Browser",
          success: true,
          failureReason: null,
          attemptedAt: addDays(now, -1, 8),
        },
        {
          id: randomUUID(),
          email: "employee.support@workkpi.com",
          userId: userId("employee.support@workkpi.com"),
          ipAddress: "10.10.0.10",
          userAgent: "Demo Browser",
          success: false,
          failureReason: "Invalid credentials",
          attemptedAt: addDays(now, -2, 10),
        },
        {
          id: randomUUID(),
          email: "director@workkpi.com",
          userId: userId("director@workkpi.com"),
          ipAddress: "10.10.0.2",
          userAgent: "Demo Browser",
          success: true,
          failureReason: null,
          attemptedAt: addDays(now, -3, 9),
        },
        ...generatedLoginAttempts,
      ],
    });

    await prisma.notification.createMany({
      data: [
        {
          id: randomUUID(),
          userId: userId("admin@workkpi.com"),
          type: "security.device_trusted",
          title: "Thiết bị mới đã được tin cậy",
          body: "MacBook Pro đã được đánh dấu là thiết bị tin cậy cho lần đăng nhập tiếp theo.",
          payload: { deviceName: "MacBook Pro" },
          readAt: null,
          createdAt: addDays(now, -1, 9),
        },
        {
          id: randomUUID(),
          userId: userId("director@workkpi.com"),
          type: "task.completed",
          title: "Báo cáo KPI đã hoàn thành",
          body: "Báo cáo KPI tháng đã sẵn sàng cho buổi demo cấp công ty.",
          payload: { taskId: taskByKey.monthlyReport },
          readAt: addDays(now, -1, 15),
          createdAt: addDays(now, -2, 10),
        },
        {
          id: randomUUID(),
          userId: userId("leader.backend@workkpi.com"),
          type: "task.assigned",
          title: "Bạn được gán task tổng hợp KPI",
          body: "Phần API tổng hợp KPI và subtask báo cáo đã được gán cho team backend.",
          payload: { taskId: taskByKey.parentKpiTask },
          readAt: null,
          createdAt: addDays(now, -1, 12),
        },
        {
          id: randomUUID(),
          userId: userId("employee.qa@workkpi.com"),
          type: "task.review",
          title: "Cần xác nhận một số chỉ số KPI",
          body: "Task kiểm thử KPI đang chờ review.",
          payload: { taskId: taskByKey.subKpiTests },
          readAt: null,
          createdAt: addDays(now, 0, 8),
        },
        ...generatedNotifications,
      ],
    });

    await prisma.kpiRecord.createMany({
      data: [...sampleUsers.flatMap((userConfig, index) => {
        const baseScore =
          userConfig.role === "ADMIN"
            ? 96
            : userConfig.role === "DIRECTOR"
              ? 93
              : userConfig.role === "MANAGER"
                ? 86 - index
                : userConfig.role === "LEADER"
                  ? 81 - (index % 2) * 3
                  : 72 - (index % 3) * 4;

        const previousScore = Math.max(55, baseScore - 6);

        return [
          {
            id: randomUUID(),
            userId: userId(userConfig.email),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            totalScore: baseScore,
            grade: gradeForScore(baseScore),
            taskBreakdown: {
              done: index % 3 === 0 ? 5 : 4,
              inProgress: index % 3 === 1 ? 3 : 2,
              overdue: index % 4 === 0 ? 0 : 1,
              pending: index % 2,
            },
            onTimeRate: Math.max(60, 92 - index * 2),
            calculatedAt: addDays(now, -1, 18),
            calculatedById: userId("admin@workkpi.com"),
          },
          {
            id: randomUUID(),
            userId: userId(userConfig.email),
            month: startOfMonth(now, -1).getMonth() + 1,
            year: startOfMonth(now, -1).getFullYear(),
            totalScore: previousScore,
            grade: gradeForScore(previousScore),
            taskBreakdown: {
              done: Math.max(1, 3 - (index % 2)),
              inProgress: 2,
              overdue: index % 3,
              pending: 1,
            },
            onTimeRate: Math.max(55, 88 - index * 2),
            calculatedAt: addDays(now, -31, 18),
            calculatedById: userId("director@workkpi.com"),
          },
        ];
      }), ...generatedKpiRecords],
    });

    await prisma.auditLog.createMany({
      data: [
        {
          id: randomUUID(),
          actorUserId: userId("director@workkpi.com"),
          action: "login",
          entityType: "user_auth",
          entityId: null,
          metadata: { email: "director@workkpi.com", success: true },
          createdAt: addDays(now, -1, 9),
        },
        {
          id: randomUUID(),
          actorUserId: userId("admin@workkpi.com"),
          action: "profile_updated",
          entityType: "profile",
          entityId: userId("admin@workkpi.com"),
          metadata: { field: "theme", value: "dark" },
          createdAt: addDays(now, -2, 10),
        },
        {
          id: randomUUID(),
          actorUserId: userId("manager.product@workkpi.com"),
          action: "settings_updated",
          entityType: "profile",
          entityId: userId("manager.product@workkpi.com"),
          metadata: { defaultTaskFilter: "department" },
          createdAt: addDays(now, -2, 14),
        },
        {
          id: randomUUID(),
          actorUserId: userId("leader.backend@workkpi.com"),
          action: "password_changed",
          entityType: "profile",
          entityId: userId("leader.backend@workkpi.com"),
          metadata: { source: "profile-settings" },
          createdAt: addDays(now, -3, 16),
        },
        {
          id: randomUUID(),
          actorUserId: userId("employee.qa@workkpi.com"),
          action: "logout",
          entityType: "user_session",
          entityId: null,
          metadata: { reason: "manual" },
          createdAt: addDays(now, -4, 18),
        },
        ...generatedAuditLogs,
      ],
    });

    console.log("Demo seed completed successfully.");
    console.log(`Created or reused ${sampleUsers.length} auth users.`);
    console.log(
      `Seeded ${seededTasks.length} tasks, ${departments.length} departments, ${teams.length} teams, KPI rows, notifications, sessions and audit logs.`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();