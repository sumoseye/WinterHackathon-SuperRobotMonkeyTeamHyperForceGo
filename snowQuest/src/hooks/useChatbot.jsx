import { useState, useCallback, useMemo, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  
  // Use a ref to prevent accidental double-firing in StrictMode
  const isProcessing = useRef(false);

  // Initialize Client - Ensure this is just the string, not an object
  const client = useMemo(() => {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenerativeAI(key);
  }, []);

  const sendMessage = useCallback(async (message) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !client || isProcessing.current) return;

    isProcessing.current = true;
    setIsLoading(true);
    setStatus('loading');
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: trimmedMessage }]);

    try {
      // Using 'gemini-2.0-flash' (Current stable high-version for Free Tier)
      // If this gives a 404, change it to 'gemini-1.5-flash'
      const model = client.getGenerativeModel({ model: "gemini-flash-lite-latest" });

      const result = await model.generateContentStream(trimmedMessage);
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      let accumulatedText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { ...newMessages[lastIndex], content: accumulatedText };
          return newMessages;
        });
      }

      setStatus('playing');
    } catch (err) {
      console.error("Gemini Error:", err);
      
      let errorMsg = "Ho ho ho! The North Pole wifi is snowy.";
      if (err.message?.includes('429')) {
        errorMsg = "Quota Exceeded! Please wait 60 seconds or check for an infinite loop in your code.";
      } else if (err.message?.includes('404')) {
        errorMsg = "Model not found. Try switching to 'gemini-1.5-flash'.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
      isProcessing.current = false;
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [client]);

  return { messages, isLoading, status, sendMessage };
};

export default useChatbot;