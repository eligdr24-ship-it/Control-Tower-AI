import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { agentKeys, fetchAgents, chatWithAgent } from '@/api/queries'
import type { Agent, ChatMessage } from '@/types'

const colorMap: Record<string, { icon: string; ring: string; dot: string }> = {
  blue:   { icon: 'bg-blue-500/12 text-blue-500',     ring: 'after:bg-blue-500',    dot: 'bg-emerald-400' },
  green:  { icon: 'bg-emerald-500/12 text-emerald-500',ring: 'after:bg-emerald-500', dot: 'bg-emerald-400' },
  amber:  { icon: 'bg-amber-500/12 text-amber-500',   ring: 'after:bg-amber-500',   dot: 'bg-amber-400'   },
  purple: { icon: 'bg-violet-500/12 text-violet-500', ring: 'after:bg-violet-500',  dot: 'bg-emerald-400' },
  red:    { icon: 'bg-red-500/12 text-red-500',       ring: 'after:bg-red-500',     dot: 'bg-red-400'     },
}

export function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [input,       setInput]       = useState('')

  const { data: agents = [], isLoading } = useQuery({
    queryKey: agentKeys.list(),
    queryFn:  fetchAgents,
  })

  const chatMutation = useMutation({
    mutationFn: ({ agentId, message }: { agentId: string; message: string }) =>
      chatWithAgent(agentId, message),
    onSuccess: reply => {
      setMessages(prev => [...prev, {
        id:        `ai-${Date.now()}`,
        role:      'assistant',
        content:   reply.content,
        timestamp: reply.timestamp,
      }])
    },
  })

  const openAgent = (agent: Agent) => {
    setActiveAgent(agent)
    setMessages([{
      id: 'intro', role: 'assistant',
      content:   agent.introMessage,
      timestamp: new Date().toISOString(),
    }])
    setInput('')
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !activeAgent) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`, role: 'user',
      content: text, timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    chatMutation.mutate({ agentId: activeAgent.id, message: text })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="AI Agent Center"
        subtitle="10 agents · All systems operational"
        actions={<Button icon="ti-shield">Permissions</Button>}
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        {/* Agent grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[100px] bg-white rounded-xl border border-gray-200 skeleton" />
              ))
            : agents.map(agent => {
                const c = colorMap[agent.color] ?? colorMap.blue
                const isActive = activeAgent?.id === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => openAgent(agent)}
                    aria-pressed={isActive}
                    className={`relative bg-white rounded-xl border p-3.5 text-left cursor-pointer transition-all
                      overflow-hidden font-[inherit]
                      after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-b-xl
                      ${isActive ? 'border-blue-400' : 'border-gray-200 hover:border-gray-300'}
                      ${c.ring}`}
                  >
                    <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[16px] mb-2 ${c.icon}`} aria-hidden="true">
                      <i className={`ti ${agent.iconName}`} />
                    </div>
                    <div className="text-[13px] font-medium text-gray-900 mb-0.5">{agent.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} aria-hidden="true" />
                      {agent.statusLabel}
                    </div>
                  </button>
                )
              })
          }
        </div>

        {/* Chat panel */}
        {activeAgent && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Chat header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100 bg-gray-50">
              <div>
                <div className="text-[14px] font-medium text-gray-900">{activeAgent.name}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${colorMap[activeAgent.color]?.dot ?? 'bg-emerald-400'}`} aria-hidden="true" />
                  {activeAgent.statusLabel}
                </div>
              </div>
              <button
                onClick={() => setActiveAgent(null)}
                className="text-gray-400 hover:text-gray-600 bg-none border-none cursor-pointer text-[18px]"
                aria-label="Close agent chat"
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-2.5 p-3.5 max-h-[280px] overflow-y-auto" role="log" aria-label="Agent conversation">
              {messages.map(msg => (
                <div key={msg.id}
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-blue-500 text-white self-end rounded-tr-sm ml-auto'
                      : 'bg-gray-100 text-gray-800 self-start rounded-tl-sm border border-gray-200'}`}
                >
                  {msg.content}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="self-start px-3 py-2 bg-gray-100 rounded-xl rounded-tl-sm border border-gray-200 text-[13px] text-gray-400">
                  Thinking…
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-gray-100 bg-gray-50">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={`Ask ${activeAgent.name} anything…`}
                className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-400 font-[inherit]"
                aria-label="Type a message"
              />
              <Button
                variant="primary" icon="ti-send"
                onClick={sendMessage}
                disabled={!input.trim() || chatMutation.isPending}
                aria-label="Send message"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
