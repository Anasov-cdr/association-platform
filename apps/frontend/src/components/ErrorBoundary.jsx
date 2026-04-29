import React from 'react'
import { Link } from 'react-router-dom'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, resetKey: props.resetKey }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error, info) {
    console.error('Page render error', error, info)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <section className="rounded-md border border-clay/20 bg-white/80 p-6 shadow-soft sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-clay">Ошибка интерфейса</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Раздел временно не открылся</h1>
        <p className="mt-3 max-w-2xl text-ink/82">
          Платформа продолжает работать. Вернитесь на главную страницу или попробуйте открыть раздел заново.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className="rounded bg-moss px-5 py-3 text-sm font-bold text-white">На главную</Link>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded border border-ink/10 bg-white px-5 py-3 text-sm font-bold text-ink"
          >
            Повторить
          </button>
        </div>
      </section>
    )
  }
}
