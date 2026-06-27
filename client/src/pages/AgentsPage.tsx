import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { mockAgents } from '@/data/mock'
import type { Agent, ChatMessage } from '@/types'
import styles from './AgentsPage.module.css'

export function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const openAgent = (agent: Agent) => {
    setActiveAgent(agent)
    setMessages([
      {
        id: 'intro',
        role: 'assistant',
        content: agent.introMessage,
        timestamp: new Date().toISOString(),
      },
    ])
    setInput('')
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !activeAgent) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // Simulated response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `I've noted your request: "${text}". In a live deployment, I would process this using my dedicated tools and memory. For detailed AI-powered answers, connect the Anthropic API in Sprint 5.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    }, 800)
  }

  return (
    <div className={styles.page}>
      <TopBar
        title="AI Agent Center"
        subtitle="10 agents · All systems operational"
        actions={<Button icon="ti-shield">Permissions</Button>}
      />

      <div className={styles.content}>
        <div className={styles.agentGrid}>
          {mockAgents.map(agent => (
            <button
              key={agent.id}
              className={`${styles.agentCard} ${styles[agent.color]} ${activeAgent?.id === agent.id ? styles.agentActive : ''}`}
              onClick={() => openAgent(agent)}
              aria-pressed={activeAgent?.id === agent.id}
            >
              <div className={`${styles.agentIcon} ${styles[`icon-${agent.color}`]}`} aria-hidden="true">
                <i className={`ti ${agent.iconName}`} />
              </div>
              <div className={styles.agentName}>{agent.name}</div>
              <div className={styles.agentStatus}>
                <div className={`${styles.statusDot} ${styles[agent.status]}`} aria-hidden="true" />
                {agent.statusLabel}
              </div>
            </button>
          ))}
        </div>

        {activeAgent && (
          <div className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <div>
                <div className={styles.chatAgentName}>{activeAgent.name}</div>
                <div className={styles.chatAgentStatus}>
                  <div className={`${styles.statusDot} ${styles[activeAgent.status]}`} aria-hidden="true" />
                  {activeAgent.statusLabel}
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setActiveAgent(null)}
                aria-label="Close agent chat"
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            <div className={styles.statsRow}>
              {activeAgent.stats.map(s => (
                <div key={s.label} className={styles.statCard}>
                  <div className={styles.statVal}>{s.value}</div>
                  <div className={styles.statLbl}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className={styles.chat} role="log" aria-label="Agent chat">
              <div className={styles.messages}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgAi}`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className={styles.inputRow}>
                <input
                  className={styles.chatInput}
                  value={input}
                  placeholder={`Ask ${activeAgent.name} anything…`}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  aria-label="Type a message"
                />
                <Button variant="primary" icon="ti-send" onClick={sendMessage} aria-label="Send message" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
