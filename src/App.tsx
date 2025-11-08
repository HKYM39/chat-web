import { useState } from "react";
import { ApolloProvider, gql, useMutation } from "@apollo/client";
import { client } from "./lib/apollo";
import "./App.css";

// 明确定义消息类型
type MsgRole = "system" | "user" | "assistant";
interface Msg {
  role: MsgRole;
  content: string;
}

// GraphQL Mutation 定义
const CHAT = gql`
  mutation Chat($model: String, $messages: [MessageInput!]!) {
    chat(model: $model, messages: $messages) {
      content
      usage {
        totalTokens
      }
    }
  }
`;

function ChatBox() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [chat, { loading }] = useMutation(CHAT);

  const send = async () => {
    if (!input.trim()) return;

    // 明确类型：user 消息
    const userMsg: Msg = { role: "user", content: input };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");

    // 调用 GraphQL
    const res = await chat({
      variables: {
        model: "deepseek-chat",
        messages: next.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    });
    console.warn(res);

    // 从 GraphQL 拿到回复
    const replyText = res.data?.chat?.content ?? "(no reply)";
    const assistantMsg: Msg = { role: "assistant", content: replyText };
    setMessages([...next, assistantMsg]);
  };

  return (
    <div className="app-shell">
      <div className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="chat-label">DeepSeek • Playground</p>
            <h1>DeepSeek Chat Demo</h1>
            <p className="chat-subtitle">
              简洁示例，使用 GraphQL 将消息发送到 deepseek-chat。
            </p>
          </div>
          <span className="chat-status">
            {loading ? "Waiting for reply..." : "Ready"}
          </span>
        </header>

        <div className="chat-window">
          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                }`}
              >
                <div className="chat-bubble-meta">
                  {m.role === "user" ? "You" : "DeepSeek"}
                </div>
                <div className="chat-bubble-content">{m.content}</div>
              </div>
            ))}
        </div>

        <div className="chat-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Say hi to DeepSeek..."
            className="chat-input"
          />
          <button
            disabled={loading}
            onClick={send}
            className="chat-send"
            type="button"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <ChatBox />
    </ApolloProvider>
  );
}
