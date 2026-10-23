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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[24px] p-8">
        <h1 className="text-4xl font-bold text-center text-black leading-tight">
          ApexCore<br/>Bank<sup className="text-xl">TM</sup>
        </h1>
        
        <h2 className="text-xl font-bold text-center mt-8 mb-6 text-black">Secure Registration</h2>

        <form onSubmit={submit} className="flex flex-col">
          <label className="text-[15px] text-black mb-2">Full Name</label>
          <input 
            className="border border-gray-300 rounded-xl p-3 mb-4 bg-white text-black"
            value={form.fullName} 
            onChange={e=>setForm({...form, fullName:e.target.value})}
          />

          <label className="text-[15px] text-black mb-2">Email</label>
          <input 
            type="email"
            className="border border-gray-300 rounded-xl p-3 mb-4 bg-white text-black"
            value={form.email} 
            onChange={e=>setForm({...form, email:e.target.value})}
          />

          <label className="text-[15px] text-black mb-2">Password (8+ chars, symbol, upper, lower, number)</label>
          <input 
            type="password"
            className="border border-gray-300 rounded-xl p-3 mb-6 bg-white text-black"
            value={form.password} 
            onChange={e=>setForm({...form, password:e.target.value})}
          />

          <button className="bg-black text-white rounded-xl py-3 font-bold">
            Create Secure Account
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-black">
          Already have account? <Link to="/login" className="text-purple-700 underline">Login</Link>
        </p>
      </div>
    </div>
  )
}