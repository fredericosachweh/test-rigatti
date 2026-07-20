import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiError, apiFetch } from "../lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const promptSuggestions = [
  "Quais motos trail vocês têm?",
  "Tem alguma BMW abaixo de R$ 90 mil?",
  "Quero uma naked com menos de 15 mil km"
];

export function ChatPage() {
  const { token } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Olá! Sou o consultor virtual da Modena SPO. Posso consultar nosso estoque de motos em tempo real. Pergunte por marca, modelo, ano, tipo ou faixa de preço."
    }
  ]);

  async function sendMessage(message: string) {
    if (!token || !message.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message.trim()
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiFetch<{ answer: string }>("/chat", {
        method: "POST",
        token,
        body: { message: message.trim() }
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof ApiError
              ? error.message
              : "Nao consegui consultar o agente neste momento."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page chat-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Modena SPO</p>
          <h2>Consultor de motos</h2>
          <p className="muted">
            Encontre a moto ideal com base no estoque real da loja — marca, modelo, ano, tipo e
            preço.
          </p>
        </div>
      </header>

      <div className="chat-layout">
        <section className="panel">
          <div className="prompt-list">
            {promptSuggestions.map((prompt) => (
              <button
                className="prompt-chip"
                key={prompt}
                onClick={() => void sendMessage(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="panel chat-panel">
          <div className="chat-stream">
            {messages.map((message) => (
              <article className={`bubble ${message.role}`} key={message.id}>
                <span className="bubble-role">
                  {message.role === "user" ? "Você" : "Modena SPO"}
                </span>
                <p>{message.content}</p>
              </article>
            ))}

            {isLoading ? (
              <article className="bubble assistant">
                <span className="bubble-role">Modena SPO</span>
                <p>Consultando o estoque...</p>
              </article>
            ) : null}
          </div>

          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pergunte sobre marcas, modelos, anos ou faixa de preço..."
              rows={3}
            />
            <button className="primary-button" disabled={isLoading || !input.trim()} type="submit">
              Enviar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
