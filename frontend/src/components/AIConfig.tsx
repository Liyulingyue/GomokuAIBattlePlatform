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
  disabled?: boolean
}

function AIConfigComponent({ ai, setAi, title, disabled = false }: AIConfigProps) {
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
          disabled={disabled}
        />
        <label>Key:</label>
        <input
          type="password"
          placeholder="API Key"
          value={ai.key}
          onChange={(e) => setAi({ ...ai, key: e.target.value })}
          disabled={disabled}
        />
        <label>模型名称:</label>
        <input
          type="text"
          placeholder="Model"
          value={ai.model}
          onChange={(e) => setAi({ ...ai, model: e.target.value })}
          disabled={disabled}
        />
        <label>自定义提示词:</label>
        <textarea
          placeholder="Custom Prompt (max 200 chars)"
          value={ai.customPrompt}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              setAi({ ...ai, customPrompt: e.target.value })
            }
          }}
          disabled={disabled}
          rows={5}
          maxLength={200}
        />
        <div style={{ fontSize: '12px', color: ai.customPrompt.length > 180 ? '#ff4d4f' : '#666', textAlign: 'right', marginTop: '4px' }}>
          {ai.customPrompt.length}/200
        </div>
      </div>
    </div>
  )
}

export default AIConfigComponent