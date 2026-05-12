import "@testing-library/jest-dom";

// Mock next/navigation for testing
vi.stubGlobal("useRouter", () => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

// Mock window.location
delete (window as any).location;
window.location = { origin: "http://localhost:3000" } as any;
