import './AIConfig.css'

interface AIConfig {
  url: string
  key: string
  model: string
  customPrompt: string
}

interface AIConfigProps {
  ai: AIConfig
  setAi: (ai: AIConfig) => void
  title: string
}

function AIConfigComponent({ ai, setAi, title }: AIConfigProps) {
  return (
    <div className="ai-config">
      <h3>{title}</h3>
      <div className="config-fields">
        <label>API URL:</label>
        <input
          type="text"
          placeholder="API URL"
          value={ai.url}
          onChange={(e) => setAi({ ...ai, url: e.target.value })}
        />
        <label>Key:</label>
        <input
          type="password"
          placeholder="API Key"
          value={ai.key}
          onChange={(e) => setAi({ ...ai, key: e.target.value })}
        />
        <label>模型名称:</label>
        <input
          type="text"
          placeholder="Model"
          value={ai.model}
          onChange={(e) => setAi({ ...ai, model: e.target.value })}
        />
        <textarea
          placeholder="Custom Prompt (max 200 chars)"
          value={ai.customPrompt}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              setAi({ ...ai, customPrompt: e.target.value })
            }
          }}
          rows={3}
          maxLength={200}
        />
      </div>
    </div>
  )
}

export default AIConfigComponent