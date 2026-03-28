import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiError, apiFetch } from "../lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const promptSuggestions = [
  "Quais tratamentos faciais vocês oferecem?",
  "Tem procedimentos de harmonização abaixo de R$1.500?",
  "Quais são as opções para rejuvenescimento corporal?"
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
        "Olá! Sou a assistente da Clínica Rigatti. Posso consultar nosso catálogo de tratamentos em tempo real. Pergunte por procedimento, faixa de valor ou indicação clínica."
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
          <p className="eyebrow">Clínica Rigatti</p>
          <h2>Assistente de tratamentos</h2>
          <p className="muted">
            Consulte procedimentos, valores e indicações clínicas com base no catálogo real da
            clínica.
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
                  {message.role === "user" ? "Você" : "Clínica Rigatti"}
                </span>
                <p>{message.content}</p>
              </article>
            ))}

            {isLoading ? (
              <article className="bubble assistant">
                <span className="bubble-role">Clínica Rigatti</span>
                <p>Consultando catálogo de tratamentos...</p>
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
              placeholder="Pergunte sobre tratamentos, valores ou indicações clínicas..."
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
