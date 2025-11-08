import { useState } from "react";
import { ApolloProvider, gql, useMutation } from "@apollo/client";
import { client } from "./lib/apollo";

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

    // 从 GraphQL 拿到回复
    const replyText = res.data?.chat?.content ?? "(no reply)";
    const assistantMsg: Msg = { role: "assistant", content: replyText };
    setMessages([...next, assistantMsg]);
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1>DeepSeek Chat Demo</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          margin: "12px 0",
          height: 420,
          overflow: "auto",
        }}
      >
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div key={i} style={{ margin: "8px 0" }}>
              <b>{m.role === "user" ? "You" : "AI"}</b>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          style={{ flex: 1 }}
          placeholder="say hi to DeepSeek..."
        />
        <button disabled={loading} onClick={send}>
          {loading ? "..." : "Send"}
        </button>
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
