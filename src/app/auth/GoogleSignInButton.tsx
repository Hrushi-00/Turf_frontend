"use client";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";

type GoogleCredentialResponse = { credential?: string };
type GoogleIdentity = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (element: HTMLElement, options: {
    theme: "outline";
    size: "large";
    shape: "rectangular";
    text: "continue_with";
    width: number;
  }) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => void;
};

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptError, setScriptError] = useState("");

  const initializeGoogle = useCallback(() => {
    const identity = window.google?.accounts?.id;
    if (!clientId || !identity || !containerRef.current) {
      setScriptError("Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID and reload.");
      return;
    }

    try {
      identity.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) onCredential(credential);
          else setScriptError("Google did not return an ID token. Please try again.");
        },
      });
      containerRef.current.replaceChildren();
      identity.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: Math.max(220, Math.min(containerRef.current.clientWidth, 360)),
      });
    } catch {
      setScriptError("Google sign-in could not initialize. Check the OAuth client ID and authorized site origin.");
    }
  }, [onCredential]);

  return (
    <div className="mt-6">
      {clientId && (
        <Script
          id="google-identity-services"
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={initializeGoogle}
          onError={() => setScriptError("Could not load Google sign-in. Check your connection and try again.")}
        />
      )}
      <div ref={containerRef} className="flex min-h-10 justify-center" />
      {!clientId && <p className="mt-2 text-center text-xs text-amber-200/80">Google sign-in needs NEXT_PUBLIC_GOOGLE_CLIENT_ID.</p>}
      {scriptError && <p role="alert" className="mt-2 text-center text-xs text-red-300">{scriptError}</p>}
    </div>
  );
}
