import { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../../components/Navbar'

export default function Messages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setConversations(response.data)
    } catch (err) {
      console.error('Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/conversations/${convId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages(response.data)
    } catch (err) {
      console.error('Failed to fetch messages')
    }
  }

  const handleSelectConversation = (conv: any) => {
    setSelectedConv(conv)
    fetchMessages(conv.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/messages/send`,
        { conversationId: selectedConv.id, text: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNewMessage('')
      fetchMessages(selectedConv.id)
    } catch (err) {
      console.error('Failed to send message')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Messages</h1>

        <div className="grid md:grid-cols-4 gap-6 h-96">
          <div className="bg-white rounded-lg shadow overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-900">Conversations</h2>
            </div>
            <div>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 ${
                    selectedConv?.id === conv.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <p className="font-semibold text-gray-900 text-sm">
                    {conv.participant_1_name || conv.participant_2_name}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{conv.last_message_text}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-lg shadow flex flex-col">
            {selectedConv ? (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-bold text-gray-900">
                    Chat with {selectedConv.participant_1_name || selectedConv.participant_2_name}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex justify-end">
                      <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg max-w-xs">
                        <p>{msg.text_content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}