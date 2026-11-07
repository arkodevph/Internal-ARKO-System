import { auth } from "../../../lib/auth";
import DashboardLayout from "../../dashboard/layout";
import InternLayout from "../(workspace)/layout";
import InternManagementPage from "../../dashboard/interns/[[...section]]/page";
import InternLoginPage from "../login/page";
jest.mock("../../../lib/auth", () => ({ auth: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("../../dashboard/_components/dashboard-shell", () => ({
  DashboardShell: () => null,
}));
jest.mock("../../../components/interns/intern-shell", () => ({
  InternShell: () => null,
}));
jest.mock("../../../components/interns/intern-portal", () => ({
  InternManagement: () => null,
}));
jest.mock("../../../components/interns/intern-login", () => ({
  InternLogin: () => null,
}));
const session = (role: string) =>
  jest
    .mocked(auth)
    .mockResolvedValue({ user: { id: "u1", name: "Test", role } } as never);
describe("intern portal page boundary", () => {
  it("redirects interns away from the main dashboard", async () => {
    session("INTERN");
    await expect(DashboardLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/intern",
    );
    await expect(
      InternManagementPage({ params: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/intern");
  });
  it("requires sign in for the restricted workspace", async () => {
    jest.mocked(auth).mockResolvedValue(null as never);
    await expect(InternLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/intern/login",
    );
  });
  it("sends admins to intern management", async () => {
    session("ADMIN");
    await expect(InternLayout({ children: null })).rejects.toThrow(
      "REDIRECT:/dashboard/interns",
    );
    await expect(InternLoginPage()).rejects.toThrow(
      "REDIRECT:/dashboard/interns",
    );
  });
  it.each(["MEMBER", "USER", "ACCOUNTANT", "CLIENT"])(
    "denies %s access to intern records",
    async (role) => {
      session(role);
      await expect(InternLayout({ children: null })).rejects.toThrow(
        "REDIRECT:/auth/login",
      );
      await expect(
        InternManagementPage({ params: Promise.resolve({}) }),
      ).rejects.toThrow("NOT_FOUND");
    },
  );
});
