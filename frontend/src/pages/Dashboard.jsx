import { useEffect, useState } from "react"
import api from "../api"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showSend, setShowSend] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [sendForm, setSendForm] = useState({ toEmail: "", amount: "", description: "" })
  const [addForm, setAddForm] = useState({ amount: "", description: "" })
  const [loading, setLoading] = useState(true)
  
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [meRes, txRes] = await Promise.all([ 
          api.get("/auth/me"), 
          api.get("/transactions") 
        ])
        setData(meRes.data)
        setTransactions(txRes.data || [])
      } catch (err) {
        if (err.response?.status === 401) navigate("/login")
      } finally { 
        setLoading(false) 
      }
    }
    fetchAll()
  }, [navigate])

  const handleSend = async (e) => {
    e.preventDefault()
    if (Number(sendForm.amount) <= 0) return alert("Amount must be > 0")
    try {
      const res = await api.post("/transactions/send", {
        toEmail: sendForm.toEmail.toLowerCase().trim(),
        amount: Number(sendForm.amount),
        description: sendForm.description
      })
      setTransactions([res.data.transaction, ...transactions])
      // Update balance in state
      setData(prev => {
        if (prev?.user) return { ...prev, user: { ...prev.user, balance: res.data.newBalance } }
        return { ...prev, balance: res.data.newBalance }
      })
      setShowSend(false)
      setSendForm({ toEmail: "", amount: "", description: "" })
    } catch (err) {
      alert(err.response?.data?.error || "Send failed")
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (Number(addForm.amount) <= 0) return alert("Amount must be > 0")
    try {
      const res = await api.post("/transactions/add", {
        amount: Number(addForm.amount),
        description: addForm.description
      })
      setTransactions([res.data.transaction, ...transactions])
      setData(prev => {
        if (prev?.user) return { ...prev, user: { ...prev.user, balance: res.data.newBalance } }
        return { ...prev, balance: res.data.newBalance }
      })
      setShowAdd(false)
      setAddForm({ amount: "", description: "" })
    } catch (err) {
      alert(err.response?.data?.error || "Add failed")
    }
  }

  if (loading) return (
    <div style={{ background: "#0a0e1f", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
      Verifying secure session...
    </div>
  )

  // FIX: Calculate real balance from transaction history
  // This fixes your $500 bug from screenshot
  const calculatedBalance = transactions.reduce((acc, tx) => {
    return tx.type === 'credit' ? acc + Number(tx.amount) : acc - Number(tx.amount)
  }, 0);
  
  // Use calculated balance - it matches history
  const balance = calculatedBalance;

  return (
    <div style={{ background: "#0a0e1f", minHeight: "100vh", display: "flex", justifyContent: "center", padding: "20px 10px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 440, padding: 24, borderRadius: 16 }}>
        <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>ApexCore Bank™</h1>
        <p style={{ textAlign: "center", fontSize: 11, color: "#666" }}>{user?.email || data?.user?.email}</p>
        
        <div style={{ background: "#e6ffe6", padding: 20, borderRadius: 12, marginTop: 16, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#555" }}>Available Balance</p>
          <h1 style={{ margin: "8px 0", fontSize: 32 }}>${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { setShowSend(true); setShowAdd(false); }} style={{ flex: 1, padding: 12, background: "black", color: "white", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Send Money</button>
            <button onClick={() => { setShowAdd(true); setShowSend(false); }} style={{ flex: 1, padding: 12, background: "white", border: "1px solid black", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Add Money</button>
          </div>
        </div>

        {showSend && (
          <div style={{ background: "#fff9e6", padding: 16, borderRadius: 12, marginTop: 16, border: "1px solid #ffdf80" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Send Money</h3>
            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="To email" value={sendForm.toEmail} onChange={e => setSendForm({...sendForm, toEmail: e.target.value})} required style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
              <input placeholder="Amount" type="number" value={sendForm.amount} onChange={e => setSendForm({...sendForm, amount: e.target.value})} required style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
              <input placeholder="Description" value={sendForm.description} onChange={e => setSendForm({...sendForm, description: e.target.value})} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
              <div style={{ display: "flex", gap: 8 }}><button type="submit" style={{ flex: 1, padding: 10, background: "black", color: "white", borderRadius: 6 }}>Confirm Send</button><button type="button" onClick={() => setShowSend(false)} style={{ flex: 1, padding: 10, background: "white", border: "1px solid #ccc", borderRadius: 6 }}>Cancel</button></div>
            </form>
          </div>
        )}

        {showAdd && (
          <div style={{ background: "#e6f7ff", padding: 16, borderRadius: 12, marginTop: 16, border: "1px solid #80cfff" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Add Money</h3>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Amount e.g. 500" type="number" value={addForm.amount} onChange={e => setAddForm({...addForm, amount: e.target.value})} required style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
              <input placeholder="Source" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
              <div style={{ display: "flex", gap: 8 }}><button type="submit" style={{ flex: 1, padding: 10, background: "black", color: "white", borderRadius: 6 }}>Confirm Add</button><button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 10, background: "white", border: "1px solid #ccc", borderRadius: 6 }}>Cancel</button></div>
            </form>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14 }}>Transaction History ({transactions.length})</h3>
          {transactions.map((tx, i) => (
            <div key={tx._id || i} style={{ display: "flex", justifyContent: "space-between", background: "#f7f7f7", padding: "10px 12px", borderRadius: 8, marginBottom: 6 }}>
              <div><p style={{ margin: 0, fontSize: 12, fontWeight: "bold" }}>{tx.description}</p><p style={{ margin: "2px 0 0", fontSize: 10, color: "#888" }}>{new Date(tx.createdAt).toLocaleString()}</p></div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: "bold", color: tx.type === 'debit' ? 'red' : 'green' }}>{tx.type === 'debit' ? '-' : '+'}${Number(tx.amount).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <button onClick={async () => { await logout(); navigate("/login") }} style={{ marginTop: 16, padding: 12, width: "100%", background: "black", color: "white", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Logout</button>
      </div>
    </div>
  )
}