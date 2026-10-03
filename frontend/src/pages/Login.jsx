import { useState } from 'react';
import { ArrowRight, Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login(){
 const {configured,signIn,signUp,signInWithGoogle,signInWithFacebook,signInWithPhone,verifyPhoneOtp,user}=useAuth(); 
 const [mode,setMode]=useState('signin'); 
 const [email,setEmail]=useState(''); 
 const [password,setPassword]=useState('');
 const [phone,setPhone]=useState('');
 const [otp,setOtp]=useState('');
 const [showOtp,setShowOtp]=useState(false);
 const [message,setMessage]=useState(''); 
 const [busy,setBusy]=useState(false); 
 const nav=useNavigate();

 async function submit(e){e.preventDefault();setBusy(true);setMessage('');try{const {error,data}=mode==='signin'?await signIn(email,password):await signUp(email,password);if(error)throw error;if(mode==='signup'&&!data.session)setMessage('Check your inbox to confirm your email, then sign in.');else nav('/')}catch(err){setMessage(err.message||'We could not sign you in.')}finally{setBusy(false)}}

 async function handlePhone(){
  if(!phone){setMessage('Enter phone with country code e.g. +2348012345678');return;}
  setBusy(true);setMessage('');
  const {error}=await signInWithPhone(phone);
  if(error) setMessage(error.message);
  else {setShowOtp(true); setMessage('OTP sent to your phone');}
  setBusy(false);
 }
 async function handleOtp(){
  setBusy(true);setMessage('');
  const {error}=await verifyPhoneOtp(phone, otp);
  if(error) setMessage(error.message);
  else nav('/');
  setBusy(false);
 }

 return <div className="auth-page"><div className="auth-card"><span className="auth-leaf"><Leaf/></span><span className="eyebrow">WELCOME TO HERBAL MIGHT</span><h1>{mode==='signin'?'Welcome back.':'Create your account.'}</h1><p className="muted">{mode==='signin'?'Sign in to continue your botanical journey.':'Join us for thoughtful, natural goodness.'}</p>{!configured&&<div className="notice-box">Demo storefront is ready. Add your Supabase URL and anon key to <code>frontend/.env</code> to enable accounts.</div>}{configured&&<>
 <form className="form-stack" onSubmit={submit}><label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input required minLength="6" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<p className="form-message">{message}</p>}<button className="button button-dark full" disabled={busy}>{busy?'Please wait…':mode==='signin'?'Sign in':'Create account'}<ArrowRight size={16}/></button></form>

 <div className="or-divider"><span>OR CONTINUE WITH</span></div>
 
 <button className="button button-outline full" onClick={async()=>{setBusy(true);const {error}=await signInWithGoogle();if(error)setMessage(error.message);setBusy(false)}} disabled={busy}>Continue with Google</button>
 
 <button className="button button-outline full" style={{marginTop:'10px', background:'#1877F2', color:'white', border:'none'}} onClick={async()=>{setBusy(true);const {error}=await signInWithFacebook();if(error)setMessage(error.message);setBusy(false)}} disabled={busy}>Continue with Facebook</button>

 <div className="or-divider"><span>OR USE PHONE</span></div>
 <div className="form-stack">
  <label>Phone number (+234...)<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+2348012345678"/></label>
  {!showOtp ? <button className="button button-dark full" onClick={handlePhone} disabled={busy}>Send OTP to Phone</button> :
  <><label>Enter OTP<input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456"/></label><button className="button button-dark full" onClick={handleOtp} disabled={busy}>Verify OTP</button></>}
 </div>

 {message&&!message.includes('inbox')&&<p className="form-message">{message}</p>}<p className="auth-toggle">{mode==='signin'?"New to Herbal Might?":"Already have an account?"} <button onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}}>{mode==='signin'?'Create account':'Sign in'}</button></p></>}{user&&<p>You are already signed in. <Link to="/">Return home</Link></p>}</div></div>;
}