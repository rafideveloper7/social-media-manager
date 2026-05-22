import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId] = useState("12345"); // Shared placeholder string for local architecture setup
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Fetch accounts connected by the current user
  const fetchLinkedAccounts = async () => {
    setLoadingAccounts(true);
    try {
      // Points to your backend endpoint that reads connected platforms from MongoDB
      const res = await axios.get(`/api/socials/accounts/${userId}`);
      setLinkedAccounts(res.data || []);
    } catch (err) {
      console.error("Error loading synchronized social channels:", err.message);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  return (
    <UserContext.Provider value={{ userId, linkedAccounts, loadingAccounts, refreshAccounts: fetchLinkedAccounts }}>
      {children}
    </UserContext.Provider>
  );
};