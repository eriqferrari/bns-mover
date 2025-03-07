import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { AppConfig, showConnect, UserSession } from '@stacks/connect';
import { useRouter } from 'next/navigation';
import { fetchCallReadOnlyFunction, Cl } from '@stacks/transactions';
import { getStxAddress } from '../utils';
const appConfig = new AppConfig(['store_write', 'publish_data']);

// Define types for the context values
interface ConnectContextType {
  authenticate: () => void;
  disconnect: () => void;
  profile: UserProfile | null;
  signedIn: boolean;
}

// Example structure for UserProfile, replace with the actual structure
interface UserProfile {
  stxAddress: {
    mainnet: string;
    testnet?: string;
  };
  [key: string]: unknown; // Extend as needed
}


// Create context with default values
export const ConnectContext = createContext<ConnectContextType>({
  authenticate: () => {},
  disconnect: () => {},
  profile: null,
  signedIn: false,
});

export const userSession = new UserSession({ appConfig });

export const ConnectProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [signedIn, setIsSignedIn] = useState(userSession.isUserSignedIn());
  const router = useRouter();
  const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';

  useEffect(() => {
    if (signedIn) {
      const userData = userSession.loadUserData();
      setProfile(userData.profile as UserProfile);
    } 
  }, [signedIn]);

  

  const authenticate = () => {
    showConnect({
      appDetails: {
        name: 'Meme',
        icon: `${window.location.origin}/logo512.png`,
      },
      redirectTo: '/',
      onFinish: async () => {
        const userData = userSession.loadUserData();
        setProfile(userData.profile as UserProfile);
        setIsSignedIn(userSession.isUserSignedIn());
        router.push('/');
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setIsSignedIn(userSession.isUserSignedIn());   
    router.push('/');
  };


  return (
    <ConnectContext.Provider
      value={{
        authenticate,
        disconnect,
        profile,
        signedIn,
      }}
    >
      {children}
    </ConnectContext.Provider>
  );
};
