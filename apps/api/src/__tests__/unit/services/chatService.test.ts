import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JwtPayload } from "../../../utils/jwt.js";

// ── Hoisted vars (available before vi.mock hoisting) ───────────────────────

const mockOpenAICreate = vi.hoisted(() => vi.fn());
const mockAnthropicCreate = vi.hoisted(() => vi.fn());
const mockEnv = vi.hoisted(() => ({
  AI_PROVIDER: "openai" as "openai" | "anthropic",
  OPENAI_API_KEY: "sk-test" as string | undefined,
  OPENAI_MODEL: "gpt-4o-mini",
  ANTHROPIC_API_KEY: "ant-test" as string | undefined,
  ANTHROPIC_MODEL: "claude-haiku-4-5-20251001"
}));

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("../../../services/productSearch.js", () => ({
  searchProductsByCompany: vi
    .fn()
    .mockResolvedValue([
      {
        id: "p1",
        name: "Botox Facial",
        description: "Tratamento facial",
        category: "Facial",
        price: 500,
        imageUrl: ""
      }
    ])
}));

vi.mock("../../../models/ChatLog.js", () => ({
  ChatLog: { create: vi.fn().mockResolvedValue({}) }
}));

vi.mock("openai", () => ({
  default: function MockOpenAI() {
    return { chat: { completions: { create: mockOpenAICreate } } };
  }
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: function MockAnthropic() {
    return { messages: { create: mockAnthropicCreate } };
  }
}));

vi.mock("../../../config/env.js", () => ({ env: mockEnv }));

// ── Imports após mocks ─────────────────────────────────────────────────────

import { runProductAssistant } from "../../../services/chatService.js";
import { searchProductsByCompany } from "../../../services/productSearch.js";
import { ChatLog } from "../../../models/ChatLog.js";

// ── Fixtures ───────────────────────────────────────────────────────────────

const clienteUser: JwtPayload = {
  userId: "user-1",
  companyId: "company-1",
  role: "cliente",
  email: "cliente@test.com",
  name: "Cliente"
};

const adminUser: JwtPayload = {
  userId: "admin-1",
  companyId: "company-1",
  role: "admin",
  email: "admin@test.com",
  name: "Admin"
};

function openAIDirectReply(content: string | null) {
  return {
    choices: [{ message: { role: "assistant", content, tool_calls: undefined } }]
  };
}

function openAIToolCallReply(toolCallId: string, args: object) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: toolCallId,
              function: { name: "search_products", arguments: JSON.stringify(args) }
            }
          ]
        }
      }
    ]
  };
}

function anthropicEndTurn(text?: string): any {
  return {
    stop_reason: "end_turn",
    content: text ? [{ type: "text", text }] : []
  };
}

function anthropicToolUse(id: string, input: object): any {
  return {
    stop_reason: "tool_use",
    content: [{ type: "tool_use", id, name: "search_products", input }]
  };
}

// ── Tests: OpenAI provider ─────────────────────────────────────────────────

describe("runProductAssistant — OpenAI provider", () => {
  beforeEach(() => {
    mockOpenAICreate.mockReset();
    vi.mocked(ChatLog.create).mockClear();
    vi.mocked(searchProductsByCompany).mockClear();
    mockEnv.AI_PROVIDER = "openai";
    mockEnv.OPENAI_API_KEY = "sk-test";
  });

  it("returns direct answer when model responds without tool call", async () => {
    mockOpenAICreate.mockResolvedValueOnce(openAIDirectReply("Temos o Botox Facial por R$500."));

    const result = await runProductAssistant({ message: "Quais tratamentos?", user: clienteUser });

    expect(result.answer).toBe("Temos o Botox Facial por R$500.");
  });

  it("calls tool and returns answer after product search", async () => {
    mockOpenAICreate
      .mockResolvedValueOnce(openAIToolCallReply("tc-1", { search: "botox" }))
      .mockResolvedValueOnce(openAIDirectReply("Encontrei: Botox Facial por R$500."));

    const result = await runProductAssistant({ message: "Tem botox?", user: clienteUser });

    expect(searchProductsByCompany).toHaveBeenCalledWith("company-1", { search: "botox" });
    expect(result.answer).toBe("Encontrei: Botox Facial por R$500.");
  });

  it("saves ChatLog for cliente role", async () => {
    mockOpenAICreate.mockResolvedValueOnce(openAIDirectReply("Resposta para cliente."));

    await runProductAssistant({ message: "Olá", user: clienteUser });

    expect(ChatLog.create).toHaveBeenCalledOnce();
    expect(ChatLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", companyId: "company-1" })
    );
  });

  it("does NOT save ChatLog for admin role", async () => {
    mockOpenAICreate.mockResolvedValueOnce(openAIDirectReply("Resposta para admin."));

    await runProductAssistant({ message: "Olá", user: adminUser });

    expect(ChatLog.create).not.toHaveBeenCalled();
  });

  it("uses fallback answer when reply content is null", async () => {
    mockOpenAICreate.mockResolvedValueOnce(openAIDirectReply(null));

    const result = await runProductAssistant({ message: "oi", user: clienteUser });

    expect(result.answer).toBe("Nao consegui gerar uma resposta agora.");
  });

  it("throws HttpError 503 when OPENAI_API_KEY is missing", async () => {
    mockEnv.OPENAI_API_KEY = undefined as any;

    await expect(runProductAssistant({ message: "oi", user: clienteUser })).rejects.toMatchObject({
      statusCode: 503
    });
  });

  it("throws HttpError 502 when reply choices are empty", async () => {
    mockOpenAICreate.mockResolvedValueOnce({ choices: [] });

    await expect(runProductAssistant({ message: "oi", user: clienteUser })).rejects.toMatchObject({
      statusCode: 502
    });
  });

  it("throws HttpError 502 after exceeding max tool call attempts", async () => {
    mockOpenAICreate.mockResolvedValue(openAIToolCallReply("tc-loop", { search: "x" }));

    await expect(runProductAssistant({ message: "loop", user: clienteUser })).rejects.toMatchObject(
      { statusCode: 502 }
    );
  });

  it("saves toolArgs in ChatLog when tool was called before final answer", async () => {
    mockOpenAICreate
      .mockResolvedValueOnce(openAIToolCallReply("tc-2", { category: "Facial" }))
      .mockResolvedValueOnce(openAIDirectReply("Temos tratamentos faciais."));

    await runProductAssistant({ message: "facial?", user: clienteUser });

    expect(ChatLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ toolArgs: { category: "Facial" } })
    );
  });

  it("ignores tool calls for unknown tool names", async () => {
    mockOpenAICreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                { id: "tc-unknown", function: { name: "unknown_tool", arguments: "{}" } }
              ]
            }
          }
        ]
      })
      .mockResolvedValueOnce(openAIDirectReply("Resposta final."));

    const result = await runProductAssistant({ message: "oi", user: clienteUser });

    expect(searchProductsByCompany).not.toHaveBeenCalled();
    expect(result.answer).toBe("Resposta final.");
  });
});

// ── Tests: Anthropic provider ──────────────────────────────────────────────

describe("runProductAssistant — Anthropic provider", () => {
  beforeEach(() => {
    mockAnthropicCreate.mockReset();
    vi.mocked(ChatLog.create).mockClear();
    vi.mocked(searchProductsByCompany).mockClear();
    mockEnv.AI_PROVIDER = "anthropic";
    mockEnv.ANTHROPIC_API_KEY = "ant-test";
  });

  it("returns direct answer on end_turn", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicEndTurn("Temos Botox Facial."));

    const result = await runProductAssistant({ message: "Quais tratamentos?", user: clienteUser });

    expect(result.answer).toBe("Temos Botox Facial.");
  });

  it("calls tool and returns answer after product search", async () => {
    mockAnthropicCreate
      .mockResolvedValueOnce(anthropicToolUse("tu-1", { search: "botox" }))
      .mockResolvedValueOnce(anthropicEndTurn("Encontrei: Botox Facial."));

    const result = await runProductAssistant({ message: "botox?", user: clienteUser });

    expect(searchProductsByCompany).toHaveBeenCalledWith("company-1", { search: "botox" });
    expect(result.answer).toBe("Encontrei: Botox Facial.");
  });

  it("saves ChatLog for cliente role", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicEndTurn("Ok!"));

    await runProductAssistant({ message: "oi", user: clienteUser });

    expect(ChatLog.create).toHaveBeenCalledOnce();
    expect(ChatLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", companyId: "company-1" })
    );
  });

  it("does NOT save ChatLog for admin role", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicEndTurn("Ok!"));

    await runProductAssistant({ message: "oi", user: adminUser });

    expect(ChatLog.create).not.toHaveBeenCalled();
  });

  it("uses fallback answer when no text block in response", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicEndTurn());

    const result = await runProductAssistant({ message: "oi", user: clienteUser });

    expect(result.answer).toBe("Nao consegui gerar uma resposta agora.");
  });

  it("throws HttpError 503 when ANTHROPIC_API_KEY is missing", async () => {
    mockEnv.ANTHROPIC_API_KEY = undefined as any;

    await expect(runProductAssistant({ message: "oi", user: clienteUser })).rejects.toMatchObject({
      statusCode: 503
    });
  });

  it("throws HttpError 502 on unexpected stop_reason", async () => {
    mockAnthropicCreate.mockResolvedValueOnce({
      stop_reason: "max_tokens",
      content: []
    });

    await expect(runProductAssistant({ message: "oi", user: clienteUser })).rejects.toMatchObject({
      statusCode: 502
    });
  });

  it("throws HttpError 502 after exceeding max tool call attempts", async () => {
    mockAnthropicCreate.mockResolvedValue(anthropicToolUse("tu-loop", { search: "x" }));

    await expect(runProductAssistant({ message: "loop", user: clienteUser })).rejects.toMatchObject(
      { statusCode: 502 }
    );
  });

  it("saves toolArgs in ChatLog when tool was called before final answer", async () => {
    mockAnthropicCreate
      .mockResolvedValueOnce(anthropicToolUse("tu-2", { minPrice: 100 }))
      .mockResolvedValueOnce(anthropicEndTurn("Resultado."));

    await runProductAssistant({ message: "preço?", user: clienteUser });

    expect(ChatLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ toolArgs: { minPrice: 100 } })
    );
  });

  it("ignores non-search_products tool_use blocks", async () => {
    mockAnthropicCreate
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [{ type: "tool_use", id: "tu-other", name: "other_tool", input: {} }]
      })
      .mockResolvedValueOnce(anthropicEndTurn("Resposta final."));

    const result = await runProductAssistant({ message: "oi", user: clienteUser });

    expect(searchProductsByCompany).not.toHaveBeenCalled();
    expect(result.answer).toBe("Resposta final.");
  });
});
