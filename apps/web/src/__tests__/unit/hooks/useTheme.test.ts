import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../../hooks/useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to light when no saved preference and no system preference", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("defaults to dark when system prefers dark", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("reads saved theme from localStorage", () => {
    localStorage.setItem("rigatti-theme", "dark");
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("toggle switches from light to dark", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggle());

    expect(result.current.theme).toBe("dark");
  });

  it("toggle switches from dark to light", () => {
    localStorage.setItem("rigatti-theme", "dark");
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggle());

    expect(result.current.theme).toBe("light");
  });

  it("persists theme change to localStorage", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggle());

    expect(localStorage.getItem("rigatti-theme")).toBe("dark");
  });

  it("sets data-theme attribute on documentElement", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => result.current.toggle());

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
