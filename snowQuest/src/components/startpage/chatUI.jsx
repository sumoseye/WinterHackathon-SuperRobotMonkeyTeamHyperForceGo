import { motion } from "framer-motion";
import { useState } from "react";
import { ImSpinner8 } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import { IoClose } from "react-icons/io5";

export const ChatUI = ({ isOpen, onClose, chatbot }) => {
  const [input, setInput] = useState("");
  
  if (!chatbot || !isOpen) return null;

  const { messages, sendMessage, isLoading, error, clearMessages } = chatbot;

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastTwoMessages = Array.isArray(messages) ? messages.slice(-2) : [];

  return (
    <motion.div
      className="chat-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxWidth: '90vw',
        height: '500px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        background: 'linear-gradient(135deg,rgb(255, 111, 111) 0%, #b71c1c 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            background: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d32f2f',
            fontWeight: 'bold'
          }}>
            🎅
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Santa's Help Desk</h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '5px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IoClose />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {lastTwoMessages.map((msg, idx) => (
          <motion.div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '18px',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg,rgb(90, 157, 225) 0%,rgb(30, 86, 142) 100%)'
                : 'linear-gradient(135deg,rgb(253, 122, 122) 0%,rgb(244, 84, 84) 100%)',
              color: 'white',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5',
              border: msg.role === 'user' 
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.1)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {msg.content}
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div
            style={{
              alignSelf: 'flex-start',
              padding: '12px 16px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg,rgb(150, 154, 161) 0%, #4a5568 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ImSpinner8 style={{ animation: 'spin 1s linear infinite' }} />
            <span>Santa is thinking...</span>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid rgba(0, 0, 0, 0.2)',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Santa for help..."
            style={{
              width: '100%',
              padding: '12px 50px 12px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(2, 0, 0, 0.2)',
              borderRadius: '25px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #4a90e2 0%,rgb(12, 76, 139) 100%)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <IoSend />
          </button>
        </div>
        
        {error && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid rgba(220, 38, 38, 0.5)',
            borderRadius: '10px',
            color: '#fecaca',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .chat-container input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .chat-container input:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .chat-container button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </motion.div>
  );
};