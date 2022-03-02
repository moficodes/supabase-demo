import './App.css';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function App() {
  const supabaseUrl = process.env.REACT_APP_API_URL;
  const supabaseKey = process.env.REACT_APP_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  let subscription = null;
  const [username, setUsername] = useState('');
  const [text, setText] = useState(''); 
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const reversed = [...messages].reverse();

  const getInitialMessages = async () => {
    if (!messages.length) {
      const { data, error } = await supabase
        .from('texts')
        .select()
        .range(0, 50)
        .order('id', { ascending: false });
      if (error) {
        setError(error);
        supabase.removeSubscription(subscription);
        subscription = null;
        return;
      }
      setMessages((prevMessages) => [...prevMessages, ...data]);
    }
  };

  const handleNewMessage = (payload) => {
    setMessages((messages) => [payload.new, ...messages]);
  };

  const getMessagesAndSubscribe = async () => {
    setError('');
    if (!subscription) {
      getInitialMessages();
      subscription = supabase
        .from('texts')
        .on('*', (payload) => {
          handleNewMessage(payload);
        })
        .subscribe();
    }
  };

  const randomUsername = () => {
    return `user${Date.now().toString().substring(8)}`;
  };

  const initializeUser = () => {
    let username = localStorage.getItem('username') || randomUsername();
    setUsername(username);
    localStorage.setItem('username', username);
  };

  const sendMessage= async (e) => {
    e.preventDefault();
    if (!text) {
      return;
    }
    try {
      const { error } = await supabase.from("texts").insert([
        {
          text: text,
          username: username,
        },
      ]);

      if (error) {
        console.error(error.message);
        return;
      }
      console.log("Sucsessfully sent!");
    } catch (error) {
      console.log("error sending message:", error);
    }
    setText('');
  }

  useEffect(() => {
    initializeUser();
    getMessagesAndSubscribe();
    return () => {
      supabase.removeSubscription();
    };
  }, []);

  return (
    <div className="App">
      <div>Hello @{username}</div>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)}></input>
      <button onClick={sendMessage}>Send</button>
      {reversed.map((message) => (
        <div key={message.id}>{message.username === username ? "Me" : message.username}: {message.text}</div>
      ))}
    </div>
  );
}
