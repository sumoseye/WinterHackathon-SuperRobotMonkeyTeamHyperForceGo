import { useState, useCallback, useEffect, useRef } from 'react';
import { Lipsync } from "wawa-lipsync";

const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const lipsyncRef = useRef(null);
  const audioRef = useRef(null);
  const initializedRef = useRef(false);

  // Initialize lipsync
  useEffect(() => {
    if (initializedRef.current) return;
    
    try {
      const lipsync = new Lipsync();
      lipsyncRef.current = lipsync;
      console.log('Lipsync initialized');
      
      const audioElement = new Audio();
      audioRef.current = audioElement;
      
      initializedRef.current = true;
    } catch (err) {
      console.error('Failed to initialize lipsync:', err);
      lipsyncRef.current = {
        processAudio: () => {
          if (status === 'playing') {
            const visemes = ['A', 'E', 'I', 'O', 'U', 'MBP'];
            const time = Date.now() * 0.005;
            const index = Math.floor(time % visemes.length);
            lipsyncRef.current.viseme = visemes[index];
          }
        },
        viseme: 'A'
      };
      initializedRef.current = true;
    }
  }, [status]);

  const sendMessage = useCallback(async (message) => {
    setIsLoading(true);
    setError(null);
    setStatus('loading');

    // Add user message
    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Smart Santa responses with study help
    let response;
    const lowerMsg = message.toLowerCase().trim();
    
    // ========== SPECIFIC MATH EXAMPLE ==========
    if (lowerMsg.includes('remainder') || lowerMsg.includes('17 divided by 5') || 
        lowerMsg.includes('17/5') || lowerMsg.includes('17 ÷ 5')) {
      response = "Ho ho ho! Let me calculate that with my Christmas math! 🎅\n\n" +
                "17 ÷ 5 = 3 with remainder 2\n\n" +
                "Here's how:\n" +
                "1. 5 × 3 = 15 (fits into 17)\n" +
                "2. 17 - 15 = 2 (that's the remainder!)\n\n" +
                "So the answer is: 3 remainder 2! 🎄";
    }
    else if (lowerMsg.includes('division') || lowerMsg.includes('divide') || lowerMsg.includes('remainder')) {
      response = "Division is like sharing Christmas cookies! 🍪 If you have 12 cookies and 3 friends, each gets 4 cookies with no remainder! " +
                "But if you have 14 cookies and 3 friends, each gets 4 cookies and 2 cookies remain! That's the remainder!";
    }
    
    // ========== STUDY HELP ==========
    else if (lowerMsg.includes('study') || lowerMsg.includes('homework') || lowerMsg.includes('exam')) {
      const studyTips = [
        "Ho ho ho! 🎅 Studying is like making toys - it takes patience! Break big tasks into small pieces like elf-sized toys!",
        "Remember, even Rudolph had to practice! 🦌 Study a little each day, and you'll shine bright on exam day!",
        "The elves work best with a schedule! Make a study timetable and take cookie breaks! 🍪",
        "Christmas magic helps with focus! Find a cozy spot, some hot cocoa, and tackle one subject at a time! ☕",
        "I check my list twice to avoid mistakes! Review your work carefully before submitting! 📝"
      ];
      response = studyTips[Math.floor(Math.random() * studyTips.length)];
    }
    else if (lowerMsg.includes('math') || lowerMsg.includes('calculate') || lowerMsg.includes('algebra')) {
      const mathTips = [
        "Numbers are like counting presents! 🎁 Take it step by step. Even complex problems become simple when broken down!",
        "Math is Christmas magic with numbers! ✨ Remember: Practice makes perfect, just like wrapping presents!",
        "Let me check my math sleigh... For tough problems, work backwards from what you know to what you need to find!",
        "Math patterns are like Christmas lights - once you see the pattern, everything lights up! 💡"
      ];
      response = mathTips[Math.floor(Math.random() * mathTips.length)];
    }
    else if (lowerMsg.includes('science') || lowerMsg.includes('physics') || lowerMsg.includes('chemistry')) {
      response = "Science is magical! 🔬 Just like my sleigh flying through the sky. Ask questions and explore - that's the spirit of discovery!";
    }
    else if (lowerMsg.includes('english') || lowerMsg.includes('write') || lowerMsg.includes('essay')) {
      response = "Writing is like telling Christmas stories! 📖 Start with an outline, add details like ornaments on a tree, and edit like checking the nice list!";
    }
    else if (lowerMsg.includes('history') || lowerMsg.includes('past')) {
      response = "History is full of stories! 📜 Just like Christmas traditions passed down through generations. Make timelines to see how everything connects!";
    }
    
    // ========== LIFE ADVICE ==========
    else if (lowerMsg.includes('stress') || lowerMsg.includes('anxious') || lowerMsg.includes('worried')) {
      const stressTips = [
        "Ho ho ho! Even Santa gets stressed before Christmas Eve! 🎅 Take deep breaths like blowing on hot cocoa, and remember - you can handle this!",
        "The North Pole gets busy too! ❄️ Make a list of what's worrying you, then tackle one thing at a time like unwrapping presents!",
        "Talk to someone you trust - just like I talk to Mrs. Claus! Sharing worries makes them lighter!",
        "Take a walk in the 'snow' of your thoughts! Fresh air and movement help clear the mind! 🚶‍♂️"
      ];
      response = stressTips[Math.floor(Math.random() * stressTips.length)];
    }
    else if (lowerMsg.includes('friend') || lowerMsg.includes('lonely') || lowerMsg.includes('alone')) {
      response = "Friendship is the best gift! 🎁 Reach out to someone today - a simple 'hello' can start something beautiful, just like Christmas lights!";
    }
    else if (lowerMsg.includes('motivat') || lowerMsg.includes('lazy') || lowerMsg.includes('procrastinat')) {
      response = "Even reindeer need encouragement! 🦌 Start with one small task - like wrapping one present. Momentum builds like a snowball!";
    }
    else if (lowerMsg.includes('future') || lowerMsg.includes('career') || lowerMsg.includes('what should i do')) {
      response = "The future is full of possibilities, like unopened presents! 🎁 Explore what makes you curious. Your unique talents are your superpower!";
    }
    
    // ========== CHRISTMAS & WISHES ==========
    else if (lowerMsg.includes('want') || lowerMsg.includes('wish') || 
        lowerMsg.includes('christmas') || lowerMsg.includes('present') || 
        lowerMsg.includes('gift')) {
      const wishes = [
        "Ho ho ho! 🎅 Tell me exactly what you'd like! I'll check if you're on the nice list!",
        "The elves can make anything! What special gift are you dreaming of this Christmas? 🎁",
        "I've been checking my list twice! What would make your Christmas magical?",
        "The workshop is buzzing! What toy or gift would bring you joy? 🛷",
        "Christmas wishes come true when they come from the heart! What's in your heart this year? ❤️"
      ];
      response = wishes[Math.floor(Math.random() * wishes.length)];
    }
    
    // ========== PERSONAL QUESTIONS ==========
    else if (lowerMsg.includes('how are you') || lowerMsg.includes('how do you do')) {
      response = "Busy preparing for Christmas Eve! The reindeer are practicing and elves are working hard! What's on your mind?";
    }
    else if (lowerMsg.includes('age') || lowerMsg.includes('old')) {
      response = "Ho ho ho! Let's just say I've seen many Christmases! 🎅 Age is just a number - what matters is the joy in your heart!";
    }
    else if (lowerMsg.includes('real') || lowerMsg.includes('exist')) {
      response = "I exist in the spirit of giving, joy, and Christmas magic! 🎄 Do you feel the Christmas spirit? That's me!";
    }
    
    // ========== REINDEER & ELVES ==========
    else if (lowerMsg.includes('reindeer') || lowerMsg.includes('rudolph')) {
      response = "Rudolph's nose is shining bright! 🦌 The whole team is ready to fly! What Christmas wish can I help with?";
    }
    else if (lowerMsg.includes('elf') || lowerMsg.includes('elves')) {
      response = "The elves are my little helpers! They can make almost anything in the workshop! What would you like them to create?";
    }
    
    // ========== NORTH POLE ==========
    else if (lowerMsg.includes('north pole') || lowerMsg.includes('where do you live')) {
      response = "It's snowy and magical here at the North Pole! ❄️ We're always making Christmas magic! What can I do for you?";
    }
    else if (lowerMsg.includes('weather') || lowerMsg.includes('cold') || lowerMsg.includes('snow')) {
      response = "Always snowy here! Perfect for sleigh rides! ☃️ What would make your holiday season warm and joyful?";
    }
    
    // ========== FOOD ==========
    else if (lowerMsg.includes('cookie') || lowerMsg.includes('milk') || lowerMsg.includes('food')) {
      response = "I love cookies and milk! 🍪 They give me energy for delivering presents all night! What's your favorite Christmas treat?";
    }
    
    else if (lowerMsg.includes('hidden') || lowerMsg.includes('items') || lowerMsg.includes('help') || lowerMsg.includes('glasses')) {
        response = "I have lost my glasses could u please find them?They are black and usually sit on my nose! Thank you!";
      }
      else if (lowerMsg.includes('found') ) {
        response = "Thank you for finding my glasses!  Now I can see the nice list clearly again.";
      }
      
    // ========== GREETINGS ==========
    else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      response = "Merry Christmas! 🎄 I'm Santa! Need study help, life advice, or Christmas wishes? I'm here for you!\n\n" +
                "Try asking me:\n" +
                "• 'What is 17 divided by 5?'\n" +
                "• 'Help me with math'\n" +
                "• 'I'm stressed about exams'\n" +
                "• 'What should I get for Christmas?'";
    }
    
    // ========== DEFAULT RESPONSES ==========
    else if (lowerMsg.includes('?') || lowerMsg.length > 15) {
      // For questions or longer messages
      const thoughtful = [
        "Ho ho ho! That's a wonderful question! 🎅 Let me think... I believe the answer involves following your heart and staying curious!",
        "Christmas wisdom says: Every challenge is an opportunity in disguise! What do you think about that?",
        "The elves and I were just discussing something similar! From our workshop perspective, I'd say... believe in magic and hard work!",
        "That reminds me of a Christmas story! 🎄 The moral was: Kindness and persistence make miracles happen!",
        "Interesting thought! Let me check my book of Christmas wisdom... Ah yes! It says: 'Joy comes from within and spreads to others!'"
      ];
      response = thoughtful[Math.floor(Math.random() * thoughtful.length)];
    }
    else {
      // Short messages get festive responses
      const defaults = [
        "Ho ho ho! 🎅 Tell me more! I'm here to help with studies, life advice, or Christmas wishes!",
        "Christmas spirit is all about helping others! How can I help you today? 🎄",
        "I'm making my list and checking it twice! What's on your mind today?",
        "The workshop is full of Christmas magic! Need study tips or life advice? I've got plenty!",
        "Christmas is the most wonderful time for learning and growing! What would you like to talk about?",
        "Even Santa needs to learn new things every day! What are you curious about? 📚",
        "Try asking me: 'What is 17 divided by 5?' for a math example! 🎅"
      ];
      response = defaults[Math.floor(Math.random() * defaults.length)];
    }
    
    const botMessage = { 
      role: 'assistant', 
      content: response
    };
    
    setMessages(prev => [...prev, botMessage]);
    setStatus('playing');
    
    // Character talks for 3-4 seconds
    setTimeout(() => {
      setStatus('idle');
    }, 3000 + Math.random() * 1000);
    
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    messages,
    isLoading,
    error,
    status,
    lipsyncManager: lipsyncRef.current,
    sendMessage,
    clearMessages,
  };
};

export default useChatbot;  