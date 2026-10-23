import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const submit = async (e) => {
    e.preventDefault()
    await api.post('/auth/register', form)
    window.location = '/login'
  }

  return (
    <div style={{minHeight:'100vh', background:'#0f172a', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
      <div style={{width:'100%', maxWidth:'380px', background:'white', borderRadius:'24px', padding:'32px'}}>
        <h1 style={{fontSize:'36px', fontWeight:'bold', textAlign:'center', color:'black', lineHeight:'1.1'}}>
          ApexCore<br/>Bank<sup style={{fontSize:'18px'}}>TM</sup>
        </h1>
        <h2 style={{textAlign:'center', marginTop:'24px', marginBottom:'24px', fontWeight:'bold', color:'black'}}>Secure Registration</h2>

        <form onSubmit={submit} style={{display:'flex', flexDirection:'column'}}>
          <label style={{fontSize:'14px', marginBottom:'6px', color:'black'}}>Full Name</label>
          <input style={{border:'1px solid #ccc', borderRadius:'12px', padding:'12px', marginBottom:'16px'}} value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} />

          <label style={{fontSize:'14px', marginBottom:'6px', color:'black'}}>Email</label>
          <input type="email" style={{border:'1px solid #ccc', borderRadius:'12px', padding:'12px', marginBottom:'16px'}} value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />

          <label style={{fontSize:'14px', marginBottom:'6px', color:'black'}}>Password (8+ chars, symbol, upper, lower, number)</label>
          <input type="password" style={{border:'1px solid #ccc', borderRadius:'12px', padding:'12px', marginBottom:'24px'}} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />

          <button style={{background:'black', color:'white', borderRadius:'12px', padding:'12px', fontWeight:'bold', border:'none', cursor:'pointer'}}>
            Create Secure Account
          </button>
        </form>

        <p style={{textAlign:'center', marginTop:'20px', fontSize:'14px', color:'black'}}>
          Already have account? <Link to="/login" style={{color:'#6b21a8'}}>Login</Link>
        </p>
      </div>
    </div>
  )
}