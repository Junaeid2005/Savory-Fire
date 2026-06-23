import React, { useState } from "react";
import { Mail, Lock, UserPlus, LogIn, Leaf, AlertCircle, CheckCircle } from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface AuthScreenProps {
  onSuccess: (email: string) => void;
  onClose?: () => void;
  inline?: boolean;
}

export default function AuthScreen({ onSuccess, onClose, inline = false }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user profile in Firestore "users" collection
        // Set isAdmin explicitly to false (must be secured server-side too!)
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          isAdmin: false,
          createdAt: new Date(), // using local date as fallback, but rules will enforce request.time
        });

        setSuccess("Account successfully registered! Logged in automatically.");
        onSuccess(user.email || "");
      } else {
        // Login existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Logged in successfully!");
        onSuccess(userCredential.user.email || "");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyMessage = "Authentication failed. Please verify credentials.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already registered.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Invalid email format.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password must be at least 6 characters.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        friendlyMessage = "Incorrect email or password.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-2xl" id="auth-form-card">
      <div className="flex flex-col items-center mb-6">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3">
          <Leaf className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          {isSignUp ? "Join Savory Green" : "Welcome Back"}
        </h2>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {isSignUp 
            ? "Create an account to order wholesome organic delicacies." 
            : "Log in to your account to place a live bKash order."}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2.5 text-emerald-700 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="auth-email-input"
              type="email"
              required
              placeholder="e.g., guest@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="auth-password-input"
              type="password"
              required
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="auth-confirm-password-input"
                type="password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                disabled={loading}
              />
            </div>
          </div>
        )}

        <button
          id="auth-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#2e7d32] hover:bg-[#1b5e20] text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#2e7d32]/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 hover:scale-[1.01]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isSignUp ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-emerald-50 pt-4 text-center">
        <button
          id="auth-toggle-btn"
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccess(null);
          }}
          className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold hover:underline"
        >
          {isSignUp 
            ? "Already have an account? Sign In" 
            : "New to Savory Green? Create an Account"}
        </button>
      </div>

      <div className="mt-4 p-2 bg-emerald-50/40 rounded-lg text-center">
        <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
          Testing as Admin? Use email <code className="bg-emerald-100 px-1 rounded text-emerald-900">junaeid2.0shohan@gmail.com</code> or any user containing <code className="bg-emerald-100 px-1 rounded text-emerald-900">admin</code>.
        </p>
      </div>
    </div>
  );

  if (inline) {
    return <div className="flex justify-center py-10">{formContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1b5e20]/10 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-black shadow-lg rounded-full w-8 h-8 flex items-center justify-center border border-white/40 focus:outline-none transition-all hover:scale-105"
          >
            &times;
          </button>
        )}
        {formContent}
      </div>
    </div>
  );
}
