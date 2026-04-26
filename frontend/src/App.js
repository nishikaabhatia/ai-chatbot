import { useState } from "react";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        message: input,
        history: history,
      });

      const reply = response.data.reply;
      const botMessage = { role: "assistant", content: reply };

      setHistory((prev) => [...prev, userMessage, botMessage]);
      setMessages((prev) => [...prev, { role: "bot", content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Error: Could not get response." },
      ]);
    }

    setLoading(false);
  };

  const clearMemory = async () => {
    await axios.delete("http://localhost:8000/memory");
    alert("Long-term memory cleared!");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🤖 AI Chatbot</h1>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#0078ff" : "#e0e0e0",
              color: msg.role === "user" ? "white" : "black",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div style={styles.loading}>Thinking...</div>}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
      <button style={styles.clearButton} onClick={clearMemory}>
        🗑️ Clear Long-term Memory
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  header: { marginBottom: "20px", fontSize: "24px" },
  chatBox: {
    display: "flex",
    flexDirection: "column",
    width: "600px",
    height: "70vh",
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "16px",
    overflowY: "auto",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    gap: "10px",
  },
  message: {
    padding: "10px 16px",
    borderRadius: "18px",
    maxWidth: "70%",
    fontSize: "15px",
    lineHeight: "1.4",
  },
  loading: { alignSelf: "flex-start", color: "#999", fontStyle: "italic" },
  inputRow: {
    display: "flex",
    marginTop: "16px",
    width: "600px",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "24px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    padding: "12px 24px",
    borderRadius: "24px",
    backgroundColor: "#0078ff",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
  },
  clearButton: {
    marginTop: "10px",
    padding: "8px 20px",
    borderRadius: "24px",
    backgroundColor: "#ff4444",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
  },
};

export default App;