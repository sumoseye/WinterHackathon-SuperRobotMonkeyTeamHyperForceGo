import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');

  // Initialize SDK
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  
  // FIXED MODEL NAME: "gemini-2.5-flash" is the stable identifier
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-lite-latest", 
    systemInstruction: "You are Santa Claus. Be jolly, warm, and helpful. Use 'Ho ho ho!' often."
  });

  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setStatus('loading');
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    const lowerMsg = message.toLowerCase().trim();
    let responseText = null;

    // --- 1. Hardcoded Logic (Fast & Free) ---
    if (lowerMsg.includes('17 divided by 5')) {
      responseText = "Ho ho ho! Let's check the math! 17 ÷ 5 = 3 with remainder 2! 🎄";
    } else if (lowerMsg.includes('glasses')) {
      responseText = "I have lost my glasses! They are black and usually sit right on my nose!";
    }

    // --- 2. Gemini 2.5 Flash API ---
    if (!responseText) {
      try {
        const result = await model.generateContent(message);
        responseText = result.response.text();
      } catch (err) {
        console.error("Gemini Error:", err);
        
        // Handle common API issues
        if (err.message.includes('429')) {
          responseText = "Ho ho ho! Too many children are talking to me! Try again in a minute.";
        } else if (err.message.includes('404')) {
          responseText = "Ho ho ho! It seems I can't find that model in my magic bag. Please check the model name!";
        } else {
          responseText = "Ho ho ho! The North Pole wifi is snowy. Can you repeat that?";
        }
      }
    }

    // Update UI with Santa's response
    setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    setStatus('playing');
    setIsLoading(false);

    // Stop lip animation after approx speech time (60ms per char)
    setTimeout(() => setStatus('idle'), Math.min(responseText.length * 60, 8000));
  }, [model]);

  return { messages, isLoading, status, sendMessage };
};

export default useChatbot;