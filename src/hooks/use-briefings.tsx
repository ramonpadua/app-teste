import React, { createContext, useContext, useState } from 'react'

export interface Briefing {
  id: string
  title: string
  date: string
  summary: string
  content: string
}

interface BriefingsContextType {
  briefings: Briefing[]
  addBriefing: (briefing: Omit<Briefing, 'id' | 'date'>) => void
  getBriefing: (id: string) => Briefing | undefined
}

const mockBriefings: Briefing[] = [
  {
    id: '1',
    title: 'Reunião de Alinhamento de Produto',
    date: '24/05/2024',
    summary: 'Discussão sobre o roadmap do Q3 e priorização de funcionalidades.',
    content:
      'Nesta reunião, a equipe discutiu os objetivos principais para o Q3. Focaremos na melhoria da experiência de onboarding e na introdução de novas integrações de API. A prioridade máxima é resolver os gargalos de desempenho relatados no Q2. Aprovamos o orçamento inicial para marketing digital.',
  },
  {
    id: '2',
    title: 'Feedback de Design',
    date: '22/05/2024',
    summary: 'Ajustes na paleta de cores e revisão do fluxo de onboarding do usuário.',
    content:
      'A equipe de design apresentou as novas propostas de cores. Acordamos em seguir com uma paleta mais sóbria e profissional (Slate/Zinc). O fluxo de onboarding foi simplificado de 5 para 3 etapas, reduzindo o atrito inicial. Precisamos de testes A/B na próxima semana.',
  },
  {
    id: '3',
    title: 'Sync Semanal de Engenharia',
    date: '20/05/2024',
    summary: 'Atualização sobre o status da integração com a API e correção de bugs críticos.',
    content:
      'O time de backend confirmou que a nova API está 90% concluída. Faltam apenas os endpoints de relatórios. O bug de duplicação de registros foi identificado e corrigido no PR #432. A próxima sprint será focada em testes end-to-end e refatoração de código legado.',
  },
]

const BriefingsContext = createContext<BriefingsContextType | undefined>(undefined)

export function BriefingsProvider({ children }: { children: React.ReactNode }) {
  const [briefings, setBriefings] = useState<Briefing[]>(mockBriefings)

  const addBriefing = (data: Omit<Briefing, 'id' | 'date'>) => {
    const newBriefing: Briefing = {
      ...data,
      id: Math.random().toString(36).substring(7),
      date: new Intl.DateTimeFormat('pt-BR').format(new Date()),
    }
    setBriefings((prev) => [newBriefing, ...prev])
  }

  const getBriefing = (id: string) => {
    return briefings.find((b) => b.id === id)
  }

  return (
    <BriefingsContext.Provider value={{ briefings, addBriefing, getBriefing }}>
      {children}
    </BriefingsContext.Provider>
  )
}

export function useBriefings() {
  const context = useContext(BriefingsContext)
  if (context === undefined) {
    throw new Error('useBriefings must be used within a BriefingsProvider')
  }
  return context
}
