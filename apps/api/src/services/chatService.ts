import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import type { JwtPayload } from "../utils/jwt.js";
import { HttpError } from "../utils/http.js";
import { searchProductsByCompany } from "./productSearch.js";
import { ChatLog } from "../models/ChatLog.js";

const SYSTEM_PROMPT =
  "Voce e o consultor virtual da Modena SPO, loja especializada em motos premium e de alta cilindrada em Curitiba. Responda sempre em portugues do Brasil, com tom entusiasta, direto e profissional de quem entende de moto. Use apenas as motos retornadas pela tool — nunca invente modelos, anos, quilometragem ou valores. Ao apresentar uma moto, destaque marca, modelo, ano, cilindrada, quilometragem e preco. Se nao houver resultado, convide o cliente a falar com a equipe pelo WhatsApp (41) 99975-5741. Seja objetivo e ajude o cliente a encontrar a moto ideal.";

const searchProductsToolDef = {
  name: "search_products",
  description:
    "Busca motos reais do estoque da loja autenticada filtrando por texto livre, marca, categoria/tipo, ano ou faixa de preco.",
  parameters: {
    type: "object" as const,
    properties: {
      search: {
        type: "string",
        description: "Busca livre por nome, modelo, marca, cor, descricao ou categoria."
      },
      category: {
        type: "string",
        description: "Categoria/tipo da moto (ex.: Naked, Trail, Custom)."
      },
      brand: { type: "string", description: "Marca desejada (ex.: BMW, Ducati, Harley-Davidson)." },
      minYear: { type: "number", description: "Ano minimo de fabricacao." },
      maxYear: { type: "number", description: "Ano maximo de fabricacao." },
      minPrice: { type: "number", description: "Preco minimo." },
      maxPrice: { type: "number", description: "Preco maximo." },
      limit: {
        type: "number",
        description: "Numero maximo de motos a retornar. Use entre 1 e 12."
      }
    },
    additionalProperties: false
  }
};

async function saveLog(
  user: JwtPayload,
  message: string,
  toolArgs: Record<string, unknown> | null,
  answer: string
) {
  if (user.role === "admin") return;

  await ChatLog.create({
    companyId: user.companyId,
    userId: user.userId,
    message,
    toolArgs,
    answer,
    provider: env.AI_PROVIDER
  }).catch(() => {
    // log silencioso — falha de persistência não deve interromper a resposta
  });
}

async function runWithOpenAI(message: string, user: JwtPayload): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(
      503,
      "OPENAI_API_KEY nao configurada. Defina a chave para habilitar o agente de IA."
    );
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Empresa do usuario: ${user.companyId}. Pergunta: ${message}` }
  ];

  const tool = { type: "function" as const, function: searchProductsToolDef };
  let lastToolArgs: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const completion = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      messages,
      tools: [tool],
      tool_choice: "auto"
    });

    const reply = completion.choices[0]?.message;
    if (!reply) throw new HttpError(502, "O modelo nao retornou resposta.");

    messages.push(reply);

    if (!reply.tool_calls?.length) {
      const answer = reply.content ?? "Nao consegui gerar uma resposta agora.";
      await saveLog(user, message, lastToolArgs, answer);
      return answer;
    }

    for (const toolCall of reply.tool_calls) {
      if (toolCall.function.name !== "search_products") continue;
      const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      lastToolArgs = args;
      const products = await searchProductsByCompany(user.companyId, args);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ products })
      });
    }
  }

  throw new HttpError(502, "O agente excedeu o numero maximo de chamadas de ferramenta.");
}

async function runWithAnthropic(message: string, user: JwtPayload): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new HttpError(
      503,
      "ANTHROPIC_API_KEY nao configurada. Defina a chave para habilitar o agente de IA."
    );
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const tool: Anthropic.Tool = {
    name: searchProductsToolDef.name,
    description: searchProductsToolDef.description,
    input_schema: searchProductsToolDef.parameters
  };

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Empresa do usuario: ${user.companyId}. Pergunta: ${message}` }
  ];
  let lastToolArgs: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages,
      tools: [tool]
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      const answer = textBlock?.text ?? "Nao consegui gerar uma resposta agora.";
      await saveLog(user, message, lastToolArgs, answer);
      return answer;
    }

    if (response.stop_reason !== "tool_use") {
      throw new HttpError(502, "O modelo retornou stop_reason inesperado.");
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use" || block.name !== "search_products") continue;
      const args = (block.input ?? {}) as Record<string, unknown>;
      lastToolArgs = args;
      const products = await searchProductsByCompany(user.companyId, args as any);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify({ products })
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  throw new HttpError(502, "O agente excedeu o numero maximo de chamadas de ferramenta.");
}

export async function runProductAssistant({
  message,
  user
}: {
  message: string;
  user: JwtPayload;
}) {
  const answer =
    env.AI_PROVIDER === "anthropic"
      ? await runWithAnthropic(message, user)
      : await runWithOpenAI(message, user);

  return { answer };
}
