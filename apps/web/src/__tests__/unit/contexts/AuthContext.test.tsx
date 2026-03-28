import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../../contexts/AuthContext";

// Mock apiFetch
vi.mock("../../../lib/api", () => ({
  apiFetch: vi.fn()
}));

import { apiFetch } from "../../../lib/api";
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

const STORAGE_KEY = "orbit-commerce-auth";

const fakeAuthResponse = {
  token: "fake-token-abc",
  user: {
    id: "user-1",
    companyId: "co-1",
    role: "admin" as const,
    email: "admin@test.com",
    name: "Admin Test"
  }
};

function TestConsumer() {
  const { user, token, isReady, logout } = useAuth();
  return (
    <div>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="user">{user?.email ?? "null"}</span>
      <span data-testid="token">{token ?? "null"}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function LoginConsumer() {
  const { login } = useAuth();
  return <button onClick={() => login({ email: "a@b.com", password: "123456" })}>login</button>;
}

describe("AuthContext — initial state", () => {
  beforeEach(() => localStorage.clear());

  it("isReady becomes true with no stored session", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("true"));
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("restores session from localStorage and refreshes user via /auth/me", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeAuthResponse));
    mockApiFetch.mockResolvedValueOnce({ user: fakeAuthResponse.user });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("true"));
    expect(screen.getByTestId("user").textContent).toBe("admin@test.com");
  });

  it("clears session when /auth/me fails", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeAuthResponse));
    mockApiFetch.mockRejectedValueOnce(new Error("unauthorized"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("true"));
    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("handles corrupt localStorage JSON gracefully", async () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("true"));
    expect(screen.getByTestId("user").textContent).toBe("null");
  });
});

describe("AuthContext — login", () => {
  beforeEach(() => {
    localStorage.clear();
    mockApiFetch.mockReset();
  });

  afterEach(() => localStorage.clear());

  it("sets user and token after successful login", async () => {
    mockApiFetch.mockResolvedValueOnce(fakeAuthResponse);

    render(
      <AuthProvider>
        <TestConsumer />
        <LoginConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("true"));

    await act(async () => {
      await userEvent.click(screen.getByText("login"));
    });

    expect(screen.getByTestId("user").textContent).toBe("admin@test.com");
    expect(screen.getByTestId("token").textContent).toBe("fake-token-abc");
  });

  it("persists session to localStorage after login", async () => {
    mockApiFetch.mockResolvedValueOnce(fakeAuthResponse);

    render(
      <AuthProvider>
        <TestConsumer />
        <LoginConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("true"));

    await act(async () => {
      await userEvent.click(screen.getByText("login"));
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.token).toBe("fake-token-abc");
  });
});

describe("AuthContext — logout", () => {
  afterEach(() => localStorage.clear());

  it("clears user, token and localStorage on logout", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeAuthResponse));
    mockApiFetch.mockResolvedValueOnce({ user: fakeAuthResponse.user });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("admin@test.com"));

    await act(async () => {
      await userEvent.click(screen.getByText("logout"));
    });

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("useAuth — outside provider", () => {
  it("throws when used outside AuthProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow("useAuth must be used within AuthProvider");
    consoleError.mockRestore();
  });
});
