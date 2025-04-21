// Login.js — Handles user authentication (manual login and sign-up)
// If login/signup logic changes, update AuthContext and backend Cognito/Amplify config.

// Updated Login.js with Sign-up functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signInWithRedirect, getCurrentUser, signUp, confirmSignUp } from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, checkAuthState } = useAuth();
  
  // States for login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // States for sign-up
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  // States for confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmationError, setConfirmationError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'researcher') {
        navigate('/researcher/dashboard');
      } else {
        navigate('/survey');
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  // Google SSO handler
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      await signInWithRedirect({
        provider: 'Google'
      });
      
      // The page will redirect to Google login
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(`Sign-in error: ${error.message || 'Failed to sign in with Google'}`);
      setIsLoading(false);
    }
  };
    
  // Email/Password login handler
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!email || !password) {
        setError('Please enter both email and password');
        setIsLoading(false);
        return;
      }

      const { isSignedIn, nextStep } = await signIn({ 
        username: email, 
        password 
      });
      
      if (isSignedIn) {
        // Update auth context
        await checkAuthState();
        // Navigate will happen in the useEffect above
      } else if (nextStep) {
        console.log('Additional auth step required:', nextStep);
        
        // If user needs to confirm their account
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          setConfirmationEmail(email);
          setShowConfirmation(true);
          setShowSignUp(false);
          setConfirmationError('Your account needs to be verified. Please check your email for a verification code.');
        } else {
          setError(`Additional step required: ${nextStep.signInStep}`);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message || 'Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle form submission for login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };
  
  // Handle sign-up form submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      setSignUpError('All fields are required');
      return;
    }
    
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match');
      return;
    }
    
    if (signUpPassword.length < 8) {
      setSignUpError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsSigningUp(true);
      setSignUpError('');
      
      // Sign up the user
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: signUpEmail,
        password: signUpPassword,
        options: {
          userAttributes: {
            email: signUpEmail,
            name: signUpName
          },
          autoSignIn: false // Disable auto sign-in
        }
      });
      
      console.log('Sign up result:', { isSignUpComplete, userId, nextStep });
      
      if (!isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        // User needs to confirm their account
        setConfirmationEmail(signUpEmail);
        setShowConfirmation(true);
        setShowSignUp(false);
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
      } else {
        // Sign up completed, show login form
        setShowSignUp(false);
        setEmail(signUpEmail);
        setPassword(''); 
        setError('Account created successfully! You can now login.');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setSignUpError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };
  
  // Handle confirmation code submission
  const handleConfirmation = async (e) => {
    e.preventDefault();
    
    if (!confirmationCode) {
      setConfirmationError('Please enter the verification code');
      return;
    }
    
    try {
      setIsConfirming(true);
      setConfirmationError('');
      
      // Confirm sign up
      await confirmSignUp({
        username: confirmationEmail,
        confirmationCode
      });
      
      // Show login form with success message
      setShowConfirmation(false);
      setEmail(confirmationEmail);
      setPassword('');
      setError('Account verified successfully! You can now login.');
    } catch (error) {
      console.error('Error confirming sign up:', error);
      setConfirmationError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };
  
  // Common styles
  const containerStyle = {
    maxWidth: '400px',
    margin: '3rem auto',
    textAlign: 'center'
  };
  
  const inputStyle = {
    padding: '0.75rem',
    margin: '0.75rem 0',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '4px',
    border: '1px solid #ddd'
  };
  
  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    marginTop: '1rem',
    background: 'linear-gradient(135deg, #500000, #800000)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  };
  
  const linkStyle = {
    color: '#500000',
    cursor: 'pointer',
    textDecoration: 'underline',
    display: 'inline-block',
    margin: '1rem 0'
  };
  
  // Show confirmation form
  if (showConfirmation) {
    return (
      <div className="container" style={containerStyle}>
        <h2>Verify Your Account</h2>
        <p>A verification code has been sent to your email. Please enter it below to verify your account.</p>
        
        {confirmationError && <p style={{ color: 'red', marginTop: '1rem' }}>{confirmationError}</p>}
        
        <form onSubmit={handleConfirmation}>
          <input
            type="text"
            placeholder="Verification Code"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            style={inputStyle}
          />
          
          <button
            type="submit"
            disabled={isConfirming}
            style={buttonStyle}
          >
            {isConfirming ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>
        
        <p style={{ marginTop: '1rem' }}>
          <span 
            onClick={() => {
              setShowConfirmation(false);
              setShowSignUp(false);
            }}
            style={linkStyle}
          >
            Back to Login
          </span>
        </p>
      </div>
    );
  }
  
  // Show sign-up form
  if (showSignUp) {
    return (
      <div className="container" style={containerStyle}>
        <h2>Create an Account</h2>
        
        {signUpError && <p style={{ color: 'red', marginTop: '1rem' }}>{signUpError}</p>}
        
        <form onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Full Name"
            value={signUpName}
            onChange={(e) => setSignUpName(e.target.value)}
            style={inputStyle}
          />
          
          <input
            type="email"
            placeholder="Email Address"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
            style={inputStyle}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
            style={inputStyle}
          />
          
          <input
            type="password"
            placeholder="Confirm Password"
            value={signUpConfirmPassword}
            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
            style={inputStyle}
          />
          
          <button
            type="submit"
            disabled={isSigningUp}
            style={buttonStyle}
          >
            {isSigningUp ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p style={{ marginTop: '1rem' }}>
          Already have an account?{' '}
          <span 
            onClick={() => setShowSignUp(false)}
            style={linkStyle}
          >
            Sign In
          </span>
        </p>
      </div>
    );
  }
  
  // Login form (default)
  return (
    <div className="container" style={containerStyle}>
      <h2>Sign In</h2>

      {/* Google Sign-In Button */}
      <button
        onClick={handleGoogleSignIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '0.75rem',
          marginBottom: '1rem',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#500000',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google Logo"
          style={{ width: '20px', verticalAlign: 'middle' }}
        />
        <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
          Sign in with Google
        </span>
      </button>

      <p style={{ margin: '1rem 0', fontWeight: '600' }}>— OR —</p>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      <form onSubmit={handleLoginSubmit}>
        <input 
          type="email" 
          placeholder="Enter your email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={inputStyle}
        />
        <input 
          type="password" 
          placeholder="Enter your password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={inputStyle}
        />
        
        <button 
          type="submit"
          disabled={isLoading}
          style={buttonStyle}
        >
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      
      <p style={{ marginTop: '1rem' }}>
        Don't have an account?{' '}
        <span 
          onClick={() => setShowSignUp(true)}
          style={linkStyle}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
};

export default Login;