import React from 'react';
export function Card({ children, className = '' }) {
  return <div className={`rounded-md border-2 border-[#8edfe7] bg-gradient-to-br from-[#f5fdff]/96 via-[#d9f5f7]/96 to-[#bdeef2]/96 p-6 shadow-[0_18px_46px_rgba(15,126,168,0.16)] backdrop-blur ${className}`}>{children}</div>
}

export function PageHero({ children, className = '' }) {
  return (
    <section className={`rounded-md border-2 border-[#72dce1] bg-gradient-to-r from-[#0879a8] via-[#1d9fbd] to-[#3bc4c7] p-6 text-white shadow-[0_20px_50px_rgba(15,126,168,0.28)] md:p-8 ${className}`}>
      {children}
    </section>
  )
}

export function Badge({ children, tone = 'moss' }) {
  const colors = {
    moss: 'bg-[#e8fbfc] text-moss',
    gold: 'bg-gold/20 text-moss',
    clay: 'bg-clay/10 text-clay'
  }
  return <span className={`rounded px-3 py-1 text-xs font-bold ${colors[tone]}`}>{children}</span>
}
